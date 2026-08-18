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
      innerRef.current?.scrollBy({ left: dir * 320, behavior: "smooth" });
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