// Read-heavy public browsing load: the homepage, a contestant detail page,
// and the watch page. These are anonymous (no auth cookie), so this is the
// scenario we can push hardest — it stresses Next.js rendering + the public
// Supabase reads (getContestants / getContestant) and any ISR/caching.

import http from "k6/http";
import { check, group, sleep } from "k6";
import { Trend } from "k6/metrics";
import { CONFIG } from "../lib/config.js";
import { fixtures, pickContestantId } from "../lib/data.js";

const homeLatency = new Trend("browse_home_ms", true);
const contestantLatency = new Trend("browse_contestant_ms", true);

export function browse() {
  group("home", function () {
    const res = http.get(`${CONFIG.baseUrl}/`, { tags: { page: "home" } });
    homeLatency.add(res.timings.duration);
    check(res, { "home 200": (r) => r.status === 200 });
  });

  const id = pickContestantId(__ITER + __VU);
  if (id) {
    group("contestant", function () {
      const res = http.get(`${CONFIG.baseUrl}/contestants/${id}`, {
        tags: { page: "contestant" },
      });
      contestantLatency.add(res.timings.duration);
      check(res, { "contestant 200": (r) => r.status === 200 });
    });
  }

  group("watch", function () {
    const res = http.get(`${CONFIG.baseUrl}/watch`, { tags: { page: "watch" } });
    check(res, { "watch 200": (r) => r.status === 200 });
  });

  // Model a viewer reading the page before navigating again.
  sleep(Math.random() * 2 + 0.5);
}
