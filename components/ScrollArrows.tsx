"use client";

import type { RefObject } from "react";
import type { ScrollRowHandle } from "./ScrollRow";

function ChevronIcon({ flipped = false }: { flipped?: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      className={flipped ? "rotate-180" : ""}
    >
      <path
        d="M9 6l6 6-6 6"
        stroke="#1e1e1e"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function ScrollArrows({
  targetRef,
}: {
  targetRef: RefObject<ScrollRowHandle>;
}) {
  return (
    <div className="flex gap-3">
      <button
        onClick={() => targetRef.current?.scrollBy(-1)}
        aria-label="Scroll left"
        className="btn-outline-chrome h-6 w-[82px] rounded-pill flex items-center justify-center"
      >
        <ChevronIcon flipped />
      </button>
      <button
        onClick={() => targetRef.current?.scrollBy(1)}
        aria-label="Scroll right"
        className="btn-outline-chrome h-6 w-[82px] rounded-pill flex items-center justify-center"
      >
        <ChevronIcon />
      </button>
    </div>
  );
}