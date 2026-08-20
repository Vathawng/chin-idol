"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function VoteWidget({
  contestantId,
  contestantName,
  pricePerVote,
}: {
  contestantId: string;
  contestantName: string;
  pricePerVote: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const presets = [1, 5, 10, 25];

  async function handleVote() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contestantId, quantity: qty }),
      });

      if (res.status === 401) {
        // Not logged in — send them to log in, then bring them right back here.
        router.push(`/login?next=${encodeURIComponent(pathname)}`);
        return;
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      window.location.href = data.url;
    } catch (e: any) {
      setError(e.message || "Couldn't start checkout. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="card-border rounded-lg p-6 sm:p-7">
      <h3 className="font-display text-[22px] leading-none text-ink uppercase mb-1">
        Vote for {contestantName}
      </h3>
      <p className="font-body text-[14px] text-ink/60 mb-5">
        ${pricePerVote.toFixed(2)} per vote · no limit on how many you cast
      </p>

      <div className="flex flex-wrap gap-2 mb-4">
        {presets.map((p) => (
          <button
            key={p}
            onClick={() => setQty(p)}
            className={`rounded-pill px-4 py-2 font-body font-bold text-[14px] transition-colors ${
              qty === p
                ? "btn-maroon text-white"
                : "card-border text-ink/70 hover:border-[#8a2532]"
            }`}
          >
            {p} vote{p > 1 ? "s" : ""}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => setQty((q) => Math.max(1, q - 1))}
          className="h-10 w-10 rounded-full card-border text-ink text-lg hover:border-[#8a2532] transition-colors"
          aria-label="Decrease votes"
        >
          −
        </button>
        <input
          type="number"
          min={1}
          value={qty}
          onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
          className="w-20 text-center card-border rounded-md py-2 font-body font-bold text-ink focus:outline-none focus:border-[#8a2532] transition-colors"
        />
        <button
          onClick={() => setQty((q) => q + 1)}
          className="h-10 w-10 rounded-full card-border text-ink text-lg hover:border-[#8a2532] transition-colors"
          aria-label="Increase votes"
        >
          +
        </button>
        <span className="ml-auto font-body text-[14px] text-ink/60">
          Total:{" "}
          <span className="font-bold text-[#8a2532]">
            ${(qty * pricePerVote).toFixed(2)}
          </span>
        </span>
      </div>

      {error && <p className="font-body text-sm text-[#8a2532] mb-4">{error}</p>}

      <button
        onClick={handleVote}
        disabled={loading}
        className="btn-maroon w-full rounded-pill h-11 font-body font-bold text-[16px] text-white disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading
          ? "Redirecting to secure checkout…"
          : `Vote ${qty} time${qty > 1 ? "s" : ""} — checkout with Stripe`}
      </button>
      <p className="text-center font-body text-[12px] text-ink/40 mt-3">
        You'll need to be signed in. Payments are processed securely by Stripe.
      </p>
    </div>
  );
}