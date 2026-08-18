"use client";

import { useRef } from "react";
import ContestantCard from "./ContestantCard";
import ScrollRow, { type ScrollRowHandle } from "./ScrollRow";
import ScrollArrows from "./ScrollArrows";
import ScrollReveal from "./ScrollReveal";
import type { Contestant } from "@/lib/contestants";

export default function ContestantsSection({
  contestants,
}: {
  contestants: Contestant[];
}) {
  const scrollRef = useRef<ScrollRowHandle>(null);

  return (
    <div>
      <ScrollReveal>
        <div className="flex items-end justify-between mb-10">
          <h2 className="font-display text-[32px] leading-none text-ink uppercase">
            Meet The Contestants
          </h2>
          <ScrollArrows targetRef={scrollRef} />
        </div>
      </ScrollReveal>
      <ScrollRow ref={scrollRef}>
        {contestants.map((c, i) => (
          <ScrollReveal key={c.id} delay={i * 100} className="shrink-0 snap-start">
            <ContestantCard contestant={c} />
          </ScrollReveal>
        ))}
      </ScrollRow>
    </div>
  );
}