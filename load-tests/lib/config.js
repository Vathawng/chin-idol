// Central config for the k6 suite. Everything tunable comes from env vars so
// the same scripts run against local, staging, or a preview URL.
//
// Read with:  import { CONFIG } from "./lib/config.js";

function env(name, fallback) {
  const v = __ENV[name];
  return v === undefined || v === "" ? fallback : v;
}

function intEnv(name, fallback) {
  const v = env(name, undefined);
  return v === undefined ? fallback : parseInt(v, 10);
}

export const CONFIG = {
  // Target app (the Vercel/Next deploy). NO trailing slash.
  baseUrl: env("BASE_URL", "http://localhost:3000").replace(/\/+$/, ""),

  // Supabase REST/anon — used by the results scenario to hit the
  // contestant_vote_totals aggregation view directly.
  supabaseUrl: env("LT_SUPABASE_URL", "").replace(/\/+$/, ""),
  anonKey: env("LT_SUPABASE_ANON_KEY", ""),

  // Stripe TEST webhook secret (whsec_...). Only used by the webhook scenario
  // to locally sign payloads. Never a live secret.
  webhookSecret: env("LT_STRIPE_WEBHOOK_SECRET", ""),

  // Which scenario to run: browse | checkout | ratelimit | webhook | results
  //                        | spike | soak | all
  scenario: env("SCENARIO", "browse"),

  // Global intensity knobs (per-scenario files read these).
  vus: intEnv("VUS", 20),
  duration: env("DURATION", "1m"),

  // Checkout is capped hard because it hits real Stripe test mode, which is
  // rate-limited (~25 write req/s in test mode). Stay well under.
  checkoutRps: intEnv("CHECKOUT_RPS", 8),
  checkoutDuration: env("CHECKOUT_DURATION", "1m"),

  // Webhook ingestion can go much harder — it never touches Stripe's servers,
  // only our own /api/webhooks/stripe + the DB insert path.
  webhookRps: intEnv("WEBHOOK_RPS", 50),
  webhookDuration: env("WEBHOOK_DURATION", "2m"),
};

// A shared, human-readable summary printed at startup so every run is
// self-documenting in the logs / CI output.
export function describeRun() {
  return (
    `\n── chin-idol load test ───────────────────────────\n` +
    ` scenario : ${CONFIG.scenario}\n` +
    ` target   : ${CONFIG.baseUrl}\n` +
    ` supabase : ${CONFIG.supabaseUrl || "(not set — results scenario disabled)"}\n` +
    ` stripe   : ${CONFIG.webhookSecret ? "webhook secret present" : "(no webhook secret — webhook scenario disabled)"}\n` +
    `──────────────────────────────────────────────────\n`
  );
}
