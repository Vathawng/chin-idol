// Correctness-under-load probe for lib/rate-limit.ts.
//
// The limiter allows 10 checkout attempts per 60s per user. This scenario
// pins ONE user and fires a burst, asserting that early requests succeed and
// later ones get 429'd — i.e. the sliding window actually engages on the live
// deploy, not just in theory. It's low-volume (a burst just past the limit)
// so it creates only a handful of real Stripe test sessions.

import http from "k6/http";
import { check } from "k6";
import { Counter } from "k6/metrics";
import { CONFIG } from "../lib/config.js";
import { sessions, fixtures } from "../lib/data.js";

const allowed = new Counter("ratelimit_allowed");
const blocked = new Counter("ratelimit_blocked");

const BURST = parseInt(__ENV.RATELIMIT_BURST || "16", 10); // > the limit of 10

export function rateLimit() {
  const session = sessions[0];
  const contestantId = (fixtures.contestantIds || [])[0];
  if (!session || !contestantId) {
    check(null, { "have session+contestant (prepare.mjs / seed)": () => false });
    return;
  }

  let saw200 = false;
  let saw429 = false;

  for (let i = 0; i < BURST; i += 1) {
    const res = http.post(
      `${CONFIG.baseUrl}/api/checkout`,
      JSON.stringify({ contestantId, quantity: 1 }),
      {
        headers: { "Content-Type": "application/json", Cookie: session.cookie },
        tags: { endpoint: "checkout", probe: "ratelimit" },
      }
    );
    if (res.status === 200) {
      allowed.add(1);
      saw200 = true;
    } else if (res.status === 429) {
      blocked.add(1);
      saw429 = true;
    }
  }

  check(null, {
    "some requests were allowed": () => saw200,
    "rate limit engaged (saw 429)": () => saw429,
  });

  if (!saw429) {
    console.warn(
      `Fired ${BURST} requests as one user but never got 429 — the rate ` +
        `limiter may not be engaging (check checkout_attempts table / limits).`
    );
  }
}
