"use client";

import { useState } from "react";

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("");
}

export default function PersonPhoto({
  src,
  name,
  className = "",
  rounded = "rounded-[4px]",
}: {
  src: string;
  name: string;
  className?: string;
  rounded?: string;
}) {
  const [errored, setErrored] = useState(false);

  if (errored) {
    return (
      <div
        className={`${className} ${rounded} bg-gradient-to-br from-[#8a2532] to-[#5a1620] flex items-center justify-center`}
      >
        <span className="font-display text-3xl text-white/90">{initials(name)}</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={name}
      onError={() => setErrored(true)}
      className={`${className} ${rounded} object-cover`}
    />
  );
}
