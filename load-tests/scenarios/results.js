// Leaderboard / results read load.
//
// The contestant_vote_totals view (supabase/schema.sql) SUMs every paid vote
// per contestant. As votes pile up during a round, that aggregation is what a
// results/leaderboard view would hit on every read — so this scenario reads it
// directly through PostgREST at concurrency to see how the SUM holds up, and
// also re-reads the public homepage.

import http from "k6/http";
import { check, group } from "k6";
import { Trend } from "k6/metrics";
import { CONFIG } from "../lib/config.js";

const totalsLatency = new Trend("results_totals_ms", true);

export function results() {
  group("vote_totals", function () {
    if (!CONFIG.supabaseUrl || !CONFIG.anonKey) {
      check(null, { "LT_SUPABASE_URL + anon key set": () => false });
      return;
    }
    const res = http.get(
      `${CONFIG.supabaseUrl}/rest/v1/contestant_vote_totals?select=id,name,votes&order=votes.desc`,
      {
        headers: { apikey: CONFIG.anonKey, Authorization: `Bearer ${CONFIG.anonKey}` },
        tags: { endpoint: "vote_totals" },
      }
    );
    totalsLatency.add(res.timings.duration);
    check(res, {
      "totals 200": (r) => r.status === 200,
      "totals is an array": (r) => {
        try {
          return Array.isArray(r.json());
        } catch {
          return false;
        }
      },
    });
  });

  group("home", function () {
    const res = http.get(`${CONFIG.baseUrl}/`, { tags: { page: "home" } });
    check(res, { "home 200": (r) => r.status === 200 });
  });
}
