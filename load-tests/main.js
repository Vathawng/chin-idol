// k6 entry point for the chin-idol voting-round load tests.
//
// Pick a scenario with the SCENARIO env var:
//   SCENARIO=browse     read-heavy public browsing (ramp)         [safe, hard]
//   SCENARIO=checkout   authenticated vote hot path (real Stripe) [capped]
//   SCENARIO=ratelimit  correctness probe for the 10/60s limiter  [tiny]
//   SCENARIO=webhook    vote-ingestion at RPS (locally signed)    [hard]
//   SCENARIO=results    leaderboard aggregation read load         [safe]
//   SCENARIO=spike      sudden traffic spike on browse            [safe, hard]
//   SCENARIO=soak       long low-level browse (leak/creep check)  [safe]
//   SCENARIO=all        browse + checkout + webhook + results     [full round]
//
// Example:
//   k6 run -e SCENARIO=browse -e BASE_URL=https://chin-idol.vercel.app main.js
//
// See load-tests/README.md for the full workflow (seed → prepare → run).

import { CONFIG, describeRun } from "./lib/config.js";
import { browse } from "./scenarios/browse.js";
import { checkout } from "./scenarios/checkout.js";
import { rateLimit } from "./scenarios/ratelimit.js";
import { webhook } from "./scenarios/webhook.js";
import { results } from "./scenarios/results.js";

// Re-export so k6's `exec` can reference each by name.
export { browse, checkout, rateLimit, webhook, results };

const S = CONFIG.scenario;

// ── executor builders ─────────────────────────────────────────────────────
const browseExec = (startTime = "0s") => ({
  exec: "browse",
  executor: "ramping-vus",
  startVUs: 0,
  startTime,
  stages: [
    { duration: "30s", target: CONFIG.vus },
    { duration: CONFIG.duration, target: CONFIG.vus },
    { duration: "15s", target: 0 },
  ],
  gracefulRampDown: "10s",
});

const spikeExec = () => ({
  exec: "browse",
  executor: "ramping-vus",
  startVUs: 0,
  stages: [
    { duration: "10s", target: Math.ceil(CONFIG.vus * 0.2) }, // warm
    { duration: "5s", target: CONFIG.vus * 3 }, // sudden spike
    { duration: "45s", target: CONFIG.vus * 3 }, // hold the spike
    { duration: "10s", target: 0 },
  ],
  gracefulRampDown: "5s",
});

const soakExec = () => ({
  exec: "browse",
  executor: "constant-vus",
  vus: Math.max(2, Math.ceil(CONFIG.vus * 0.3)),
  duration: CONFIG.duration === "1m" ? "30m" : CONFIG.duration,
});

const checkoutExec = (startTime = "0s") => ({
  exec: "checkout",
  executor: "constant-arrival-rate",
  rate: CONFIG.checkoutRps,
  timeUnit: "1s",
  duration: CONFIG.checkoutDuration,
  startTime,
  preAllocatedVUs: Math.max(10, CONFIG.checkoutRps * 4),
  maxVUs: Math.max(20, CONFIG.checkoutRps * 10),
});

const webhookExec = (startTime = "0s") => ({
  exec: "webhook",
  executor: "constant-arrival-rate",
  rate: CONFIG.webhookRps,
  timeUnit: "1s",
  duration: CONFIG.webhookDuration,
  startTime,
  preAllocatedVUs: Math.max(20, CONFIG.webhookRps * 2),
  maxVUs: Math.max(50, CONFIG.webhookRps * 6),
});

const ratelimitExec = () => ({
  exec: "rateLimit",
  executor: "per-vu-iterations",
  vus: 1,
  iterations: 1,
  maxDuration: "1m",
});

const resultsExec = (startTime = "0s") => ({
  exec: "results",
  executor: "constant-vus",
  vus: CONFIG.vus,
  duration: CONFIG.duration,
  startTime,
});

// ── scenario selection ─────────────────────────────────────────────────────
function buildScenarios() {
  switch (S) {
    case "browse":
      return { browse: browseExec() };
    case "checkout":
      return { checkout: checkoutExec() };
    case "ratelimit":
      return { ratelimit: ratelimitExec() };
    case "webhook":
      return { webhook: webhookExec() };
    case "results":
      return { results: resultsExec() };
    case "spike":
      return { spike: spikeExec() };
    case "soak":
      return { soak: soakExec() };
    case "all":
      // A full "voting round" shape: browsing throughout, votes flowing in via
      // checkout + webhook, results being read. Staggered so ramps don't all
      // collide at t=0.
      return {
        browse: browseExec("0s"),
        results: resultsExec("5s"),
        checkout: checkoutExec("10s"),
        webhook: webhookExec("10s"),
      };
    default:
      throw new Error(`Unknown SCENARIO="${S}". See main.js header for options.`);
  }
}

export const options = {
  scenarios: buildScenarios(),
  thresholds: {
    // Page reads should stay responsive.
    "http_req_duration{page:home}": ["p(95)<2000"],
    "browse_contestant_ms": ["p(95)<2000"],
    // Checkout carries real Stripe latency, so a looser bound.
    "checkout_ms": ["p(95)<3500"],
    // Ingestion + aggregation are our own code — keep them tight.
    "webhook_ms": ["p(95)<1200"],
    "results_totals_ms": ["p(95)<1200"],
    // Our checks are written to PASS on expected 429/403, so a low pass rate
    // means something is genuinely wrong (auth rejected, 5xx, bad signature).
    "checks": ["rate>0.98"],
  },
  // Don't count intentional 429/403 (rate-limited / voting-closed) as errors;
  // per-scenario checks and custom counters track those instead.
  discardResponseBodies: false,
};

export default function () {
  // Fallback for `k6 run main.js` with no scenario override.
  browse();
}

export function setup() {
  console.log(describeRun());
  return {};
}
