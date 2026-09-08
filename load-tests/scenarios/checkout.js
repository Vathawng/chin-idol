// Anonymous checkout load — the vote hot path.
//
// POST /api/checkout with just a contestant id + quantity (no auth — voting is
// anonymous). This exercises, in order (see app/api/checkout/route.ts):
//   IP rate limit  ->  getVotingStatus()  ->  getContestant()
//   ->  stripe.checkout.sessions.create()
//
// Two things to keep in mind:
//   1. The last step hits REAL Stripe test mode, so the arrival rate is capped
//      well under Stripe's test limits (CONFIG.checkoutRps).
//   2. The rate limiter is now per-IP (10 / 60s). All traffic from one k6 box
//      shares an IP, so after ~10 requests/min you'll mostly see 429s. That's
//      the limiter working as designed — 429 is treated as an expected result
//      here, not a failure. To measure raw checkout throughput instead, run
//      distributed (k6 cloud / multiple IPs) or temporarily raise the limit in
//      lib/rate-limit.ts on a throwaway deploy.

import http from "k6/http";
import { check } from "k6";
import { Trend, Counter } from "k6/metrics";
import { CONFIG } from "../lib/config.js";
import { pickContestantId, fixtures } from "../lib/data.js";

const checkoutLatency = new Trend("checkout_ms", true);
const rateLimited = new Counter("checkout_rate_limited");
const votingClosed = new Counter("checkout_voting_closed");
const created = new Counter("checkout_session_created");

export function checkout() {
  const contestantId = pickContestantId(__ITER);
  if (!contestantId) {
    check(null, { "have a contestant (seed the DB / run prepare.mjs)": () => false });
    return;
  }

  const res = http.post(
    `${CONFIG.baseUrl}/api/checkout`,
    JSON.stringify({ contestantId, quantity: (__ITER % 3) + 1 }),
    {
      headers: { "Content-Type": "application/json" },
      tags: { endpoint: "checkout" },
    }
  );

  checkoutLatency.add(res.timings.duration);

  // 200 = Stripe session created. 429 = IP rate limited (expected under load
  // from one box). 403 = voting closed. 5xx = a real problem.
  check(res, {
    "checkout not 5xx": (r) => r.status < 500,
    "checkout returned url or known state": (r) =>
      r.status === 200 || r.status === 429 || r.status === 403,
  });

  if (res.status === 200) created.add(1);
  else if (res.status === 429) rateLimited.add(1);
  else if (res.status === 403) votingClosed.add(1);
}

export function checkoutSetupCheck() {
  if ((fixtures.contestantIds || []).length === 0) {
    throw new Error("No contestants — run scripts/seed-round.mjs + prepare.mjs first.");
  }
}
