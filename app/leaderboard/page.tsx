import Link from "next/link";
import { MOCK_CONTESTANTS } from "@/lib/contestants";

export default function LeaderboardPage() {
  const ranked = [...MOCK_CONTESTANTS].sort((a, b) => b.votes - a.votes);
  const total = ranked.reduce((sum, c) => sum + c.votes, 0);

  return (
    <div className="mx-auto max-w-3xl px-6 py-20">
      <p className="font-display text-[14px] tracking-widest text-ink/50 uppercase mb-2">
        Live Standings
      </p>
      <h1 className="font-display text-[40px] leading-none text-ink uppercase mb-2">
        Leaderboard
      </h1>
      <p className="font-body text-[16px] text-ink/60 mb-10">
        {total.toLocaleString()} total votes cast so far this season.
      </p>

      <ol className="space-y-3">
        {ranked.map((c, i) => {
          const pct = total ? Math.round((c.votes / total) * 100) : 0;
          return (
            <li key={c.id}>
              <Link
                href={`/contestants/${c.id}`}
                className="card-border flex items-center gap-4 rounded-lg p-4"
              >
                <span className="font-display text-[24px] w-10 text-center text-ink/40 shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-display text-[20px] text-ink uppercase truncate">
                      {c.name}
                    </span>
                    <span className="font-body font-bold text-sm text-[#8a2532] tabular-nums shrink-0">
                      {c.votes.toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-ink/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#8a2532] to-[#5a1620]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
