// Authenticated checkout load — the vote hot path.
//
// POST /api/checkout with a real logged-in session cookie. This exercises,
// in order (see app/api/checkout/route.ts):
//   auth.getUser()  ->  checkCheckoutRateLimit()  ->  getVotingStatus()
//   ->  getContestant()  ->  stripe.checkout.sessions.create()
//
// Because the last step hits REAL Stripe test mode, this scenario is driven by
// a constant-arrival-rate executor capped well under Stripe's test limits
// (CONFIG.checkoutRps). We're measuring our own end-to-end latency and how the
// rate limiter + round lookup behave under sustained arrivals.

import http from "k6/http";
import { check } from "k6";
import { Trend, Counter } from "k6/metrics";
import { CONFIG } from "../lib/config.js";
import { pickSession, pickContestantId, sessions } from "../lib/data.js";

const checkoutLatency = new Trend("checkout_ms", true);
const rateLimited = new Counter("checkout_rate_limited");
const votingClosed = new Counter("checkout_voting_closed");
const created = new Counter("checkout_session_created");

export function checkout() {
  const session = pickSession(__VU + __ITER);
  const contestantId = pickContestantId(__ITER);

  if (!session) {
    check(null, { "have a session (run prepare.mjs)": () => false });
    return;
  }
  if (!contestantId) {
    check(null, { "have a contestant (seed the DB)": () => false });
    return;
  }

  const res = http.post(
    `${CONFIG.baseUrl}/api/checkout`,
    JSON.stringify({ contestantId, quantity: (__ITER % 3) + 1 }),
    {
      headers: { "Content-Type": "application/json", Cookie: session.cookie },
      tags: { endpoint: "checkout" },
    }
  );

  checkoutLatency.add(res.timings.duration);

  // 200 = Stripe session created. 429 = rate limited (expected under bursts).
  // 403 = voting closed. 401 = auth cookie rejected (a real problem here).
  check(res, {
    "checkout not 401 (auth ok)": (r) => r.status !== 401,
    "checkout not 5xx": (r) => r.status < 500,
    "checkout returned url or known state": (r) =>
      r.status === 200 || r.status === 429 || r.status === 403,
  });

  if (res.status === 200) created.add(1);
  else if (res.status === 429) rateLimited.add(1);
  else if (res.status === 403) votingClosed.add(1);
  else if (res.status === 401) {
    console.error(
      `checkout 401 for ${session.email} — session cookie rejected. ` +
        `Re-run prepare.mjs (tokens expire) or check LT_PROJECT_REF.`
    );
  }
}

export function checkoutSetupCheck() {
  if (sessions.length === 0) {
    throw new Error("No sessions — run scripts/prepare.mjs before the checkout scenario.");
  }
}
