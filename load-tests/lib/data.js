// Loads the fixtures produced by scripts/prepare.mjs into k6.
//
// Voting is anonymous, so there are no per-user sessions — just the contestant
// ids and the open round id the scenarios need.

export const fixtures = (function () {
  try {
    return JSON.parse(open("../data/fixtures.json"));
  } catch (e) {
    return { contestantIds: [], roundId: null };
  }
})();

export function pickContestantId(index) {
  const ids = fixtures.contestantIds || [];
  if (ids.length === 0) return null;
  return ids[index % ids.length];
}
