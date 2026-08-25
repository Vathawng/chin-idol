import { createClient } from "@/lib/supabase/server";

export type VotingRound = {
  id: string;
  name: string;
  opens_at: string;
  closes_at: string;
};

export type VotingStatus =
  | { open: true; round: VotingRound }
  | { open: false; round: null; nextRound: VotingRound | null };

// The single source of truth for whether voting is open right now.
// Used both to gate /api/checkout and to drive what the UI shows.
export async function getVotingStatus(): Promise<VotingStatus> {
  const supabase = createClient();
  const nowIso = new Date().toISOString();

  const { data: current } = await supabase
    .from("voting_rounds")
    .select("id, name, opens_at, closes_at")
    .lte("opens_at", nowIso)
    .gte("closes_at", nowIso)
    .order("closes_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (current) {
    return { open: true, round: current };
  }

  const { data: next } = await supabase
    .from("voting_rounds")
    .select("id, name, opens_at, closes_at")
    .gt("opens_at", nowIso)
    .order("opens_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return { open: false, round: null, nextRound: next ?? null };
}