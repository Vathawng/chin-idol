// Prepare fixtures for the k6 load tests.
//
//   node --env-file=load-tests/.env.loadtest load-tests/scripts/prepare.mjs
//
// Produces two files k6 reads at runtime:
//   load-tests/data/sessions.json  — a pool of authenticated VU sessions
//                                    (Cookie header + access token + user id)
//   load-tests/data/fixtures.json  — contestant ids + the current round id
//
// Both are git-ignored. Re-run whenever sessions expire (access tokens are
// short-lived — typically 1 hour) or the round changes.

import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import {
  getConfig,
  ensureUser,
  mintSession,
  sessionToCookies,
  cookieHeader,
  rest,
} from "./_supabase.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = resolve(__dirname, "..", "data");

const USER_COUNT = parseInt(process.env.LT_USER_COUNT || "50", 10);
const EMAIL_PREFIX = process.env.LT_EMAIL_PREFIX || "loadtest";
const EMAIL_DOMAIN = process.env.LT_EMAIL_DOMAIN || "loadtest.example.com";
const PASSWORD = process.env.LT_USER_PASSWORD || "LoadTest!" + "aA9".repeat(3);

function emailFor(i) {
  return `${EMAIL_PREFIX}+${i}@${EMAIL_DOMAIN}`;
}

async function main() {
  const cfg = getConfig();
  console.log(`Preparing ${USER_COUNT} test sessions against ${cfg.supabaseUrl}`);
  console.log(`Cookie name: sb-${cfg.projectRef}-auth-token`);

  const sessions = [];
  for (let i = 0; i < USER_COUNT; i += 1) {
    const email = emailFor(i);
    try {
      const user = await ensureUser(cfg, email, PASSWORD);
      const session = await mintSession(cfg, email);
      const cookies = sessionToCookies(cfg.projectRef, session);
      sessions.push({
        email,
        userId: user?.id || session.user?.id,
        accessToken: session.access_token,
        cookie: cookieHeader(cookies),
      });
      if ((i + 1) % 10 === 0 || i === USER_COUNT - 1) {
        console.log(`  minted ${i + 1}/${USER_COUNT}`);
      }
    } catch (err) {
      console.error(`  ! ${email}: ${err.message}`);
    }
  }

  if (sessions.length === 0) {
    throw new Error("No sessions minted — check service-role key and Supabase URL.");
  }

  // Contestants (public read via service role so RLS is never in the way).
  const contestants = await rest(cfg, "/contestants?select=id,name&order=sort_order");
  const contestantIds = contestants.map((c) => c.id);
  if (contestantIds.length === 0) {
    console.warn(
      "  ! No contestants found. Run seed-round.mjs (or seed the DB) before " +
        "the checkout/webhook scenarios."
    );
  }

  // Current open round (mirrors lib/supabase/rounds.ts getVotingStatus()).
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
    resolve(dataDir, "sessions.json"),
    JSON.stringify(sessions, null, 2)
  );
  await writeFile(
    resolve(dataDir, "fixtures.json"),
    JSON.stringify(
      { contestantIds, roundId, roundName: openRounds[0]?.name || null, generatedAt: nowIso },
      null,
      2
    )
  );

  console.log(
    `\nWrote ${sessions.length} sessions, ${contestantIds.length} contestants, ` +
      `round=${roundId || "none"} to load-tests/data/.`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
