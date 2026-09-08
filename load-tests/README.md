# chin-idol — voting-round load tests

A [k6](https://k6.io) suite that stresses the paths that get hammered during a
live voting round, plus the tooling to set it up safely against a **staging**
deploy using **Stripe test mode**.

> ⚠️ **Staging only.** Everything here uses service-role / test keys and creates
> test votes and (a few) real Stripe *test-mode* sessions. Never point it at
> production.

**Voting is anonymous** — there are no accounts; the Stripe payment is the gate.
That makes these tests simple: no login, no session cookies, no user pool. Just
seed a round, capture ids, and drive traffic.

## What it tests

| Scenario | Hits | Load | What it proves |
|---|---|---|---|
| `browse` | `/`, `/contestants/[id]`, `/watch` | hard | Public rendering + Supabase public reads hold up under a crowd. |
| `checkout` | `POST /api/checkout` (anonymous) | **capped** | The vote hot path end-to-end: IP rate limit → round lookup → contestant lookup → **real Stripe test session**. |
| `ratelimit` | `POST /api/checkout` (burst from one IP) | tiny | The 10-per-60s **per-IP** limiter in `lib/rate-limit.ts` actually engages on the live deploy. |
| `webhook` | `POST /api/webhooks/stripe` (locally signed) | hard | Vote ingestion: signature verify + `votes` insert + `unique(stripe_session_id)` idempotency, without waiting on Stripe. |
| `results` | `contestant_vote_totals` view + `/` | hard | The leaderboard SUM aggregation stays fast as votes pile up. |
| `spike` | browse, sudden 3× surge | hard | Behavior when traffic jumps at showtime. |
| `soak` | browse, long + steady | steady | No latency creep / leaks over time. |
| `all` | browse + checkout + webhook + results | mixed | A realistic full-round shape, all at once. |

## Why checkout is capped — and the per-IP limiter caveat

`POST /api/checkout` calls `stripe.checkout.sessions.create()` — a **real**
call to Stripe. Stripe test mode is rate-limited (~25 writes/s) and every call
litters the test dashboard, so `checkout` runs at a modest arrival rate
(`CHECKOUT_RPS`, default 8/s).

**The app rate-limits checkout per client IP (10 / 60s).** All traffic from one
k6 box shares an IP, so the `checkout` and `ratelimit` scenarios will start
returning `429` after ~10 requests/min — that's the limiter working, and `429`
is treated as an expected result, not a failure. To measure raw checkout
*throughput*, run distributed (k6 cloud / multiple IPs) or temporarily raise
the limit in `lib/rate-limit.ts` on a throwaway deploy.

To stress **vote ingestion** hard, the `webhook` scenario constructs
`checkout.session.completed` events and verifies them with the endpoint's own
**test-mode** signing secret (`LT_STRIPE_WEBHOOK_SECRET`) — the standard offline
way to exercise a webhook receiver. That never touches Stripe's servers, so it
can run at high RPS and directly load the DB insert + idempotency path.

## Prerequisites

- **k6**: `brew install k6` (macOS) or see https://k6.io/docs/get-started/installation/
- **Node 18+** (for the setup scripts; uses built-in `fetch` and `--env-file`).

## Setup

```bash
cd load-tests
cp .env.loadtest.example .env.loadtest   # then fill in staging/test values
```

Fill in `.env.loadtest`:
- `BASE_URL` — the staging app URL.
- `LT_SUPABASE_URL`, `LT_SUPABASE_ANON_KEY`, `LT_SUPABASE_SERVICE_ROLE_KEY` — staging Supabase.
- `LT_STRIPE_WEBHOOK_SECRET` — the **test-mode** signing secret for that deploy's `/api/webhooks/stripe` (only needed for the `webhook` scenario).

## Workflow

```bash
# 1. Ensure contestants + an OPEN round exist (staging DB only).
npm run seed

# 2. Capture contestant ids + the open round id into data/fixtures.json.
#    Re-run whenever the open round changes.
npm run prepare

# 3. Smoke test: is the app up and does anonymous checkout respond sanely?
npm run verify

# 4. Run a scenario.
npm run browse
npm run checkout
npm run ratelimit
npm run webhook
npm run results
npm run all

# Clean up the seeded LOADTEST round afterwards.
npm run seed:cleanup
```

Each k6 run writes a machine-readable summary to `load-tests/results/`.

## Tuning intensity

Set these in `.env.loadtest` or override per run with `-e` on the k6 CLI:

| Var | Default | Meaning |
|---|---|---|
| `VUS` | 20 | Virtual users for browse/results/spike/soak. |
| `DURATION` | 1m | Steady-state hold. |
| `CHECKOUT_RPS` | 8 | Arrival rate for the (real-Stripe) checkout path. Keep < ~20. |
| `WEBHOOK_RPS` | 50 | Arrival rate for locally-signed ingestion. Push this. |
| `RATELIMIT_BURST` | 16 | Requests fired from one IP by the rate-limit probe. |

Example — a heavier browse spike straight from the CLI:

```bash
cd load-tests && set -a && source .env.loadtest && set +a
k6 run -e SCENARIO=spike -e VUS=100 main.js
```

## Thresholds (pass/fail)

Defined in `main.js`:
- `http_req_duration{page:home}` p95 < 2s, contestant p95 < 2s
- `checkout_ms` p95 < 3.5s (includes real Stripe)
- `webhook_ms` p95 < 1.2s, `results_totals_ms` p95 < 1.2s
- `checks` pass rate > 98%

Checks are written to **pass** on expected `429` (rate limited) and `403`
(voting closed), so a failing `checks` rate means something genuinely wrong:
a `5xx`, or a rejected webhook signature (`400`).

## Files

```
main.js                 k6 entry: scenario selection + thresholds
lib/config.js           env-driven config
lib/data.js             loads fixtures.json (contestant + round ids)
lib/stripe-sig.js       builds + signs test webhook events with the test secret
scenarios/*.js          one file per scenario
scripts/_supabase.mjs   config + PostgREST read/seed helper
scripts/seed-round.mjs  seed contestants + an open round
scripts/prepare.mjs     capture contestant + round ids into fixtures.json
scripts/verify.mjs      pre-flight smoke test
scripts/run.sh          sources .env.loadtest then runs k6
data/                   generated fixtures (git-ignored)
```

## Safety checklist

- [ ] `.env.loadtest` points at **staging**, not production.
- [ ] Supabase + Stripe keys are **test/staging** keys.
- [ ] You ran `npm run verify` and got a non-5xx before the big runs.
- [ ] You ran `npm run seed:cleanup`, and can delete the seeded `LOADTEST` round
      and any `cs_load_*` test votes afterwards.
```
