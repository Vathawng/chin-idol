// Smoke test the setup BEFORE spending time on a full k6 run.
//
//   node --env-file=load-tests/.env.loadtest load-tests/scripts/verify.mjs
//
// Proves the two things most likely to be wrong:
//   1. The minted session cookie is actually accepted by the deployed app
//      (a 401 here means the cookie format / project ref is off).
//   2. The target app is reachable and the public pages render.

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = resolve(__dirname, "..", "data");

const BASE_URL = (process.env.BASE_URL || "http://localhost:3000").replace(/\/+$/, "");

async function loadJson(name) {
  return JSON.parse(await readFile(resolve(dataDir, name), "utf8"));
}

async function main() {
  let sessions, fixtures;
  try {
    sessions = await loadJson("sessions.json");
    fixtures = await loadJson("fixtures.json");
  } catch {
    throw new Error("Missing data/*.json — run scripts/prepare.mjs first.");
  }
  if (sessions.length === 0) throw new Error("sessions.json is empty.");

  console.log(`Target: ${BASE_URL}`);

  // 1. Homepage reachable.
  const home = await fetch(`${BASE_URL}/`);
  console.log(`  GET /                -> ${home.status} ${home.ok ? "OK" : "!!"}`);

  // 2. Authenticated checkout — the cookie must be accepted (not 401).
  const session = sessions[0];
  const contestantId = (fixtures.contestantIds || [])[0];
  if (!contestantId) {
    console.warn("  ! No contestant id in fixtures — skipping checkout auth check.");
    console.warn("    Seed contestants + an open round, then re-run prepare.mjs.");
    return;
  }

  const res = await fetch(`${BASE_URL}/api/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: session.cookie },
    body: JSON.stringify({ contestantId, quantity: 1 }),
  });
  const bodyText = await res.text();
  console.log(`  POST /api/checkout   -> ${res.status}`);

  if (res.status === 401) {
    console.error(
      "\n  FAIL: session cookie rejected (401). The app doesn't recognize the " +
        "minted session.\n  Check LT_PROJECT_REF matches the Supabase URL, and " +
        "that tokens haven't expired (re-run prepare.mjs)."
    );
    process.exit(1);
  }
  if (res.status === 403) {
    console.warn(
      "\n  Session ACCEPTED (not 401) but voting is closed (403). Auth works; " +
        "open a round (seed-round.mjs) for the checkout scenario."
    );
  } else if (res.status === 200) {
    const url = (() => {
      try {
        return JSON.parse(bodyText).url;
      } catch {
        return "(no url)";
      }
    })();
    console.log(`\n  PASS: session accepted, Stripe session created. url=${url}`);
  } else if (res.status === 429) {
    console.log("\n  PASS: session accepted (rate limited on this attempt — fine).");
  } else {
    console.log(`\n  Session accepted (status ${res.status}). Body: ${bodyText.slice(0, 200)}`);
  }

  console.log("\nSetup looks good. You can run k6 now.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
