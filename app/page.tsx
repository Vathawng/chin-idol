import Link from "next/link";
import Image from "next/image";
import ContestantCard from "@/components/ContestantCard";
import PanelCard from "@/components/PanelCard";
import ScrollRow from "@/components/ScrollRow";
import { MOCK_CONTESTANTS, MOCK_PANEL } from "@/lib/contestants";

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative h-[950px] max-h-[130vh] min-h-[700px] overflow-hidden">
        <Image
          src="/images/hero-winner.jpg"
          alt="Last season's America Chin Idol winner performing on stage"
          fill
          priority
          className="object-cover object-[75%_20%]"
        />
        <div className="absolute inset-0 bg-[rgba(30,30,30,0.37)]" />

        {/* Big chrome logo badge, right side */}
        <div className="hidden lg:block absolute right-[8%] top-[32%] w-[380px] xl:w-[461px]">
          <Image
            src="/images/logo.png"
            alt=""
            width={461}
            height={452}
            className="w-full h-auto"
          />
        </div>

        <div className="relative h-full flex items-center">
          <div className="mx-auto max-w-[1440px] px-6 sm:px-12 lg:px-32 w-full">
            <div className="max-w-[508px]">
              <h1 className="font-display text-[40px] sm:text-[48px] leading-none text-white uppercase">
                America Chin Idol
              </h1>
              <p className="font-body text-[16px] text-white mt-4 leading-relaxed">
                Every voice from the hills deserves a stage. Register free,
                then vote as many times as you like for your favorite
                performer.
              </p>
              <div className="flex flex-wrap items-center gap-4 mt-8">
                <Link
                  href="/signup"
                  className="btn-maroon rounded-pill h-10 px-6 flex items-center font-body font-bold text-[16px] text-white"
                >
                  Register to Vote
                </Link>
                <Link
                  href="/watch"
                  className="btn-ghost rounded-pill h-10 px-6 flex items-center gap-2 font-body font-bold text-[16px] text-white"
                >
                  Watch Live
                  <span className="live-dot h-2 w-2 rounded-full" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Meet the Contestants */}
      <section id="contestants" className="mx-auto max-w-[1440px] px-6 sm:px-12 lg:px-32 py-20">
        <div className="flex items-end justify-between mb-10">
          <h2 className="font-display text-[32px] leading-none text-ink uppercase">
            Meet The Contestants
          </h2>
        </div>
        <ScrollRow>
          {MOCK_CONTESTANTS.map((c) => (
            <ContestantCard key={c.id} contestant={c} />
          ))}
        </ScrollRow>
      </section>

      {/* Meet the Panel */}
      <section className="mx-auto max-w-[1440px] px-6 sm:px-12 lg:px-32 pb-20">
        <h2 className="font-display text-[32px] leading-none text-ink uppercase mb-10">
          Meet The Panel
        </h2>
        <div className="flex flex-wrap gap-12">
          {MOCK_PANEL.map((m) => (
            <PanelCard key={m.id} member={m} />
          ))}
        </div>
      </section>

      {/* Cast Your Vote Now banner */}
      <section className="bg-gradient-to-r from-[#060729] to-[#17183f]">
        <div className="mx-auto max-w-[1440px] px-6 sm:px-12 lg:px-32 py-14 flex flex-col sm:flex-row items-center justify-between gap-8 text-center sm:text-left">
          <div>
            <h2 className="font-display text-[32px] leading-none text-white uppercase">
              Cast Your Vote Now!
            </h2>
            <p className="font-body text-[16px] text-white mt-3 flex items-center justify-center sm:justify-start gap-2">
              Voting is <span className="font-bold">LIVE</span>
              <span className="live-dot h-2 w-2 rounded-full" />
            </p>
          </div>
          <Link
            href="/signup"
            className="btn-maroon rounded-pill h-10 px-6 flex items-center font-body font-bold text-[16px] text-white shrink-0"
          >
            Cast Your Vote
          </Link>
        </div>
      </section>
    </div>
  );
}
