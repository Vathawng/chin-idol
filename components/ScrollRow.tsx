"use client";

import { useRef } from "react";

export default function ScrollRow({
  gap = "gap-10",
  children,
}: {
  gap?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  function scrollBy(dir: 1 | -1) {
    ref.current?.scrollBy({ left: dir * 320, behavior: "smooth" });
  }

  return (
    <div>
      <div className="flex justify-end gap-3 mb-6">
        <button
          onClick={() => scrollBy(-1)}
          aria-label="Scroll left"
          className="btn-outline-chrome h-6 w-[82px] rounded-pill flex items-center justify-center"
        >
          <span className="text-ink text-sm">‹</span>
        </button>
        <button
          onClick={() => scrollBy(1)}
          aria-label="Scroll right"
          className="btn-outline-chrome h-6 w-[82px] rounded-pill flex items-center justify-center"
        >
          <span className="text-ink text-sm">›</span>
        </button>
      </div>
      <div
        ref={ref}
        className={`flex ${gap} overflow-x-auto scrollbar-none scroll-smooth snap-x snap-mandatory pb-2`}
      >
        {children}
      </div>
    </div>
  );
}
