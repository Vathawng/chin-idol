// Loads the fixtures produced by scripts/prepare.mjs into k6.
//
// SharedArray keeps a single copy of the data in memory across all VUs
// instead of one copy per VU — important when you scale to hundreds of VUs.

import { SharedArray } from "k6/data";

export const sessions = new SharedArray("sessions", function () {
  try {
    return JSON.parse(open("../data/sessions.json"));
  } catch (e) {
    return [];
  }
});

export const fixtures = (function () {
  try {
    return JSON.parse(open("../data/fixtures.json"));
  } catch (e) {
    return { contestantIds: [], roundId: null };
  }
})();

// Deterministic-ish pick from the session pool for a given VU/iter so load is
// spread across users (and so the rate-limit scenario can pin a single user).
export function pickSession(index) {
  if (sessions.length === 0) return null;
  return sessions[index % sessions.length];
}

export function pickContestantId(index) {
  const ids = fixtures.contestantIds || [];
  if (ids.length === 0) return null;
  return ids[index % ids.length];
}
