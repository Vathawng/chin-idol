"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";

export type ScrollRowHandle = {
  scrollBy: (dir: 1 | -1) => void;
};

type ScrollRowProps = {
  gap?: string;
  children: React.ReactNode;
};

const ScrollRow = forwardRef<ScrollRowHandle, ScrollRowProps>(function ScrollRow(
  { gap = "gap-10", children },
  ref
) {
  const innerRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    scrollBy: (dir: 1 | -1) => {
      const el = innerRef.current;
      if (!el) return;
      // Clamp manually so the button can never scroll past real content —
      // relying on the browser alone can overshoot into empty trailing
      // space when combined with scroll-snap, which looks like a blank card.
      const maxScroll = el.scrollWidth - el.clientWidth;
      const target = Math.min(maxScroll, Math.max(0, el.scrollLeft + dir * 320));
      el.scrollTo({ left: target, behavior: "smooth" });
    },
  }));

  return (
    <div
      ref={innerRef}
      className={`flex ${gap} overflow-x-auto scrollbar-none scroll-smooth snap-x snap-mandatory pb-2`}
    >
      {children}
    </div>
  );
});

export default ScrollRow;