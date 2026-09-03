// Seed a load-test-ready state: a handful of contestants and one currently
// OPEN voting round, so the checkout and webhook scenarios have real ids to
// work with.
//
//   node --env-file=load-tests/.env.loadtest load-tests/scripts/seed-round.mjs
//
// Safe to run against a STAGING database only. It inserts a round named
// "LOADTEST …" and (if the contestants table is empty) a few placeholder
// contestants. It never touches production-looking data. Clean up afterwards
// with:  node ... seed-round.mjs --cleanup
//
// NOTE: this assumes the deployed schema has `voting_rounds(id,name,opens_at,
// closes_at)` and `contestants(...)` as used by lib/supabase/rounds.ts and
// supabase/schema.sql. Column names that differ will surface as REST errors.

import { getConfig, rest } from "./_supabase.mjs";

const CLEANUP = process.argv.includes("--cleanup");
const ROUND_NAME = "LOADTEST round (safe to delete)";

async function cleanup(cfg) {
  await rest(cfg, `/voting_rounds?name=eq.${encodeURIComponent(ROUND_NAME)}`, {
    method: "DELETE",
    prefer: "return=minimal",
  });
  console.log("Removed LOADTEST round(s).");
}

async function main() {
  const cfg = getConfig();
  if (CLEANUP) return cleanup(cfg);

  // Ensure at least a few contestants exist.
  const existing = await rest(cfg, "/contestants?select=id&limit=1");
  if (existing.length === 0) {
    console.log("No contestants found — inserting 4 placeholders.");
    await rest(cfg, "/contestants", {
      method: "POST",
      prefer: "return=minimal",
      body: [
        { name: "LT Contestant A", hometown: "Testville", sort_order: 1 },
        { name: "LT Contestant B", hometown: "Testville", sort_order: 2 },
        { name: "LT Contestant C", hometown: "Testville", sort_order: 3 },
        { name: "LT Contestant D", hometown: "Testville", sort_order: 4 },
      ],
    });
  } else {
    console.log("Contestants already present — leaving them untouched.");
  }

  // Open a round window: opened 1 minute ago, closes in 6 hours.
  const opensAt = new Date(Date.now() - 60_000).toISOString();
  const closesAt = new Date(Date.now() + 6 * 60 * 60_000).toISOString();

  // Remove any prior LOADTEST round first so we don't stack duplicates.
  await rest(cfg, `/voting_rounds?name=eq.${encodeURIComponent(ROUND_NAME)}`, {
    method: "DELETE",
    prefer: "return=minimal",
  });

  const [round] = await rest(cfg, "/voting_rounds", {
    method: "POST",
    prefer: "return=representation",
    body: [{ name: ROUND_NAME, opens_at: opensAt, closes_at: closesAt }],
  });

  console.log(`Opened round ${round.id} (${ROUND_NAME}), closes ${closesAt}.`);
  console.log("Now run prepare.mjs to mint sessions and capture this round id.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
