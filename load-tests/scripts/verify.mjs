// Smoke test the setup BEFORE spending time on a full k6 run.
//
//   node --env-file=load-tests/.env.loadtest load-tests/scripts/verify.mjs
//
// Voting is anonymous, so there's nothing to authenticate — this just checks
// the target is reachable and that /api/checkout responds sensibly (200 with a
// Stripe url, or a known 403/429), not a 5xx.

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = resolve(__dirname, "..", "data");

const BASE_URL = (process.env.BASE_URL || "http://localhost:3000").replace(/\/+$/, "");

async function main() {
  let fixtures;
  try {
    fixtures = JSON.parse(await readFile(resolve(dataDir, "fixtures.json"), "utf8"));
  } catch {
    throw new Error("Missing data/fixtures.json — run scripts/prepare.mjs first.");
  }

  console.log(`Target: ${BASE_URL}`);

  const home = await fetch(`${BASE_URL}/`);
  console.log(`  GET /                -> ${home.status} ${home.ok ? "OK" : "!!"}`);

  const contestantId = (fixtures.contestantIds || [])[0];
  if (!contestantId) {
    console.warn("  ! No contestant id in fixtures — seed contestants + an open round.");
    return;
  }

  const res = await fetch(`${BASE_URL}/api/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contestantId, quantity: 1 }),
  });
  const bodyText = await res.text();
  console.log(`  POST /api/checkout   -> ${res.status}`);

  if (res.status >= 500) {
    console.error(`\n  FAIL: server error. Body: ${bodyText.slice(0, 300)}`);
    process.exit(1);
  }
  if (res.status === 403) {
    console.warn("\n  Reachable, but voting is closed (403). Run seed-round.mjs to open one.");
  } else if (res.status === 200) {
    const url = (() => {
      try {
        return JSON.parse(bodyText).url;
      } catch {
        return "(no url)";
      }
    })();
    console.log(`\n  PASS: anonymous checkout created a Stripe session. url=${url}`);
  } else if (res.status === 429) {
    console.log("\n  PASS: reachable (rate limited on this attempt — fine).");
  } else {
    console.log(`\n  Reachable (status ${res.status}). Body: ${bodyText.slice(0, 200)}`);
  }

  console.log("\nSetup looks good. You can run k6 now.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
