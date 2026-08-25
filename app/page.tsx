import Link from "next/link";
import Image from "next/image";
import ContestantsSection from "@/components/ContestantsSection";
import PanelCard from "@/components/PanelCard";
import ScrollReveal from "@/components/ScrollReveal";
import HeroVoteButton from "@/components/HeroVoteButton";
import VoteBannerButton from "@/components/VoteBannerButton";
import { MOCK_PANEL } from "@/lib/contestants";
import { getContestants } from "@/lib/supabase/contestants";
import { getVotingStatus } from "@/lib/supabase/rounds";

// Neither getContestants() nor getVotingStatus() touch cookies/auth, so this
// page no longer needs to be fully dynamic — it's regenerated at most every
// 15 seconds instead of hitting Supabase on every single page load. The
// auth-dependent bits (button label/href) live in small Client Components
// below so they don't force the whole page out of caching.
export const revalidate = 15;

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function HomePage() {
  const [contestants, votingStatus] = await Promise.all([
    getContestants(),
    getVotingStatus(),
  ]);
  return (
    <div>
      {/* Hero — left text column and right logo, aligned on one row */}
      <section className="relative h-screen overflow-hidden">
        <Image
          src="/images/hero-winner.jpg"
          alt="Last season's Chin American Idol winner performing on stage"
          fill
          priority
          className="object-cover object-[72%_30%] lg:object-[72%_35%]"
        />
        <div className="absolute inset-0 bg-[rgba(30,30,30,0.37)]" />

        <div className="relative h-full flex items-center">
          <div className="mx-auto max-w-[1440px] px-6 sm:px-12 lg:px-32 w-full flex items-center justify-between gap-10">
            <div className="max-w-[508px]">
              <ScrollReveal>
                <h1 className="font-display text-[40px] sm:text-[48px] leading-none text-white uppercase">
                  Chin American Idol
                </h1>
              </ScrollReveal>
              <ScrollReveal delay={120}>
                <p className="font-body text-[16px] text-white mt-4 leading-relaxed">
                  Every voice from the hills deserves a stage. Register free,
                  then vote as many times as you like for your favorite
                  performer.
                </p>
              </ScrollReveal>
              <ScrollReveal delay={240}>
                <div className="flex flex-wrap items-center gap-4 mt-8">
                  <HeroVoteButton />
                  <Link
                    href="/watch"
                    className="btn-ghost rounded-pill h-10 px-6 flex items-center gap-2 font-body font-bold text-[16px] text-white"
                  >
                    Watch Live
                    <span className="live-dot h-2 w-2 rounded-full" />
                  </Link>
                </div>
              </ScrollReveal>
            </div>

            <ScrollReveal delay={150} className="hidden lg:block shrink-0 w-[320px] xl:w-[380px]">
              <Image
                src="/images/logo.png"
                alt="Chin American Idol"
                width={461}
                height={452}
                className="w-full h-auto"
                priority
              />
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Meet the Contestants */}
      <section id="contestants" className="mx-auto max-w-[1440px] px-6 sm:px-12 lg:px-32 py-20">
        <ContestantsSection contestants={contestants} />
      </section>

      {/* Meet the Panel — always a horizontal scroller, never stacks */}
      <section className="mx-auto max-w-[1440px] px-6 sm:px-12 lg:px-32 pb-20">
        <ScrollReveal>
          <h2 className="font-display text-[32px] leading-none text-ink uppercase mb-10">
            Meet The Panel
          </h2>
        </ScrollReveal>
        <div className="flex gap-12 overflow-x-auto scrollbar-none scroll-smooth snap-x snap-mandatory pb-2">
          {MOCK_PANEL.map((m, i) => (
            <ScrollReveal
              key={m.id}
              delay={i * 100}
              className={`shrink-0 ${i === MOCK_PANEL.length - 1 ? "snap-end" : "snap-start"}`}
            >
              <PanelCard member={m} />
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* Cast Your Vote Now banner */}
      <section className="bg-gradient-to-r from-[#060729] to-[#17183f]">
        <ScrollReveal className="mx-auto max-w-[1440px] px-6 sm:px-12 lg:px-32 py-14 flex flex-col sm:flex-row items-center justify-between gap-8 text-center sm:text-left">
          <>
            <div>
              <h2 className="font-display text-[32px] leading-none text-white uppercase">
                Cast Your Vote Now!
              </h2>
              {votingStatus.open ? (
                <p className="font-body text-[16px] text-white mt-3 flex items-center justify-center sm:justify-start gap-2">
                  Voting is <span className="font-bold">LIVE</span>
                  <span className="live-dot h-2 w-2 rounded-full" />
                </p>
              ) : (
                <p className="font-body text-[16px] text-white/70 mt-3">
                  {votingStatus.nextRound
                    ? `Voting opens ${formatDate(votingStatus.nextRound.opens_at)}.`
                    : "No voting round is currently scheduled."}
                </p>
              )}
            </div>
            <VoteBannerButton votingOpen={votingStatus.open} />
          </>
        </ScrollReveal>
      </section>
    </div>
  );
}