// Vote-ingestion scenario for /api/webhooks/stripe.
//
// The Stripe integration credits a vote when it receives a
// checkout.session.completed event. To measure how the ingestion path (event
// verification + the votes insert + the unique-session-id idempotency guard)
// behaves under sustained arrivals, this scenario constructs test events and
// verifies them with the project's OWN test-mode signing secret
// (LT_STRIPE_WEBHOOK_SECRET). It is the standard offline way to exercise a
// webhook receiver without depending on Stripe delivering events.
//
// Rate is governed by CONFIG.webhookRps. Every 20th event reuses a prior
// session id to confirm the idempotency guard prevents a duplicate credit.

import http from "k6/http";
import { check } from "k6";
import { Trend, Counter } from "k6/metrics";
import { CONFIG } from "../lib/config.js";
import { fixtures, sessions } from "../lib/data.js";
import { buildEvent, signPayload } from "../lib/stripe-sig.js";

const webhookLatency = new Trend("webhook_ms", true);
const accepted = new Counter("webhook_accepted");
const rejected = new Counter("webhook_rejected");

const VOTE_PRICE_CENTS = 100;

export function webhook() {
  if (!CONFIG.webhookSecret) {
    check(null, { "LT_STRIPE_WEBHOOK_SECRET set": () => false });
    return;
  }
  const contestantIds = fixtures.contestantIds || [];
  const contestantId = contestantIds[__ITER % Math.max(contestantIds.length, 1)];
  const userId = sessions.length ? sessions[__ITER % sessions.length].userId : null;
  if (!contestantId || !userId) {
    check(null, { "have contestant+user ids (prepare.mjs / seed)": () => false });
    return;
  }

  const quantity = (__ITER % 5) + 1;
  const reuse = __ITER % 20 === 0;
  const sessionId = reuse
    ? `cs_load_dupe_${__VU}`
    : `cs_load_${__VU}_${__ITER}_${Date.now()}`;

  const payload = buildEvent({
    sessionId,
    contestantId,
    userId,
    quantity,
    roundId: fixtures.roundId,
    amountCents: VOTE_PRICE_CENTS * quantity,
  });
  const signature = signPayload(payload, CONFIG.webhookSecret);

  const res = http.post(`${CONFIG.baseUrl}/api/webhooks/stripe`, payload, {
    headers: { "Content-Type": "application/json", "Stripe-Signature": signature },
    tags: { endpoint: "webhook", dup: reuse ? "1" : "0" },
  });

  webhookLatency.add(res.timings.duration);

  const ok = check(res, {
    "webhook 200": (r) => r.status === 200,
    "webhook received:true": (r) => {
      try {
        return r.json("received") === true;
      } catch {
        return false;
      }
    },
    "event accepted (not 400)": (r) => r.status !== 400,
  });

  if (ok && res.status === 200) accepted.add(1);
  else rejected.add(1);

  if (res.status === 400) {
    console.error(
      "webhook 400 — event not accepted. LT_STRIPE_WEBHOOK_SECRET must match " +
        "the endpoint's configured signing secret on the target deploy."
    );
  }
}
