import { notFound } from "next/navigation";
import PersonPhoto from "@/components/PersonPhoto";
import VoteWidget from "@/components/VoteWidget";
import { VOTE_PRICE_CENTS } from "@/lib/contestants";
import { getContestant } from "@/lib/supabase/contestants";
import { getVotingStatus } from "@/lib/supabase/rounds";

export default async function ContestantPage({ params }: { params: { id: string } }) {
  const [contestant, votingStatus] = await Promise.all([
    getContestant(params.id),
    getVotingStatus(),
  ]);
  if (!contestant) notFound();

  return (
    <div className="mx-auto max-w-5xl px-6 py-16 grid md:grid-cols-5 gap-10">
      <div className="md:col-span-2">
        <PersonPhoto
          src={contestant.image_url}
          name={contestant.name}
          className="w-full aspect-[4/5]"
        />
      </div>

      <div className="md:col-span-3">
        <p className="font-display text-[14px] tracking-widest text-ink/50 uppercase mb-3">
          {contestant.hometown}
        </p>
        <h1 className="font-display text-[40px] sm:text-[48px] leading-none text-ink uppercase mb-4">
          {contestant.name}
        </h1>
        <p className="font-body text-[16px] text-ink/70 leading-relaxed mb-8">
          {contestant.bio}
        </p>

        <VoteWidget
          contestantId={contestant.id}
          contestantName={contestant.name}
          pricePerVote={VOTE_PRICE_CENTS / 100}
          votingStatus={votingStatus}
        />
      </div>
    </div>
  );
}