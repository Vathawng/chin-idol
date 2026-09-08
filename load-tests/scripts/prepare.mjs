// Prepare fixtures for the k6 load tests.
//
//   node --env-file=load-tests/.env.loadtest load-tests/scripts/prepare.mjs
//
// Voting is anonymous, so there are no sessions to mint — this just captures
// the ids the scenarios need:
//   load-tests/data/fixtures.json  — contestant ids + the current open round id
//
// Re-run whenever the open round changes. Git-ignored.

import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { getConfig, rest } from "./_supabase.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = resolve(__dirname, "..", "data");

async function main() {
  const cfg = getConfig();
  console.log(`Reading fixtures from ${cfg.supabaseUrl}`);

  const contestants = await rest(cfg, "/contestants?select=id,name&order=sort_order");
  const contestantIds = contestants.map((c) => c.id);
  if (contestantIds.length === 0) {
    console.warn("  ! No contestants found. Run seed-round.mjs (or seed the DB) first.");
  }

  const nowIso = new Date().toISOString();
  const openRounds = await rest(
    cfg,
    `/voting_rounds?select=id,name,opens_at,closes_at` +
      `&opens_at=lte.${nowIso}&closes_at=gte.${nowIso}` +
      `&order=closes_at.asc&limit=1`
  );
  const roundId = openRounds[0]?.id || null;
  if (!roundId) {
    console.warn(
      "  ! No round is currently open. Checkout will 403 and webhook votes " +
        "will have a null round_id. Run seed-round.mjs to open one."
    );
  }

  await writeFile(
    resolve(dataDir, "fixtures.json"),
    JSON.stringify(
      { contestantIds, roundId, roundName: openRounds[0]?.name || null, generatedAt: nowIso },
      null,
      2
    )
  );

  console.log(
    `\nWrote ${contestantIds.length} contestants, round=${roundId || "none"} ` +
      `to load-tests/data/fixtures.json.`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
