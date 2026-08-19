import LiveStreamPlayer from "@/components/LiveStreamPlayer";

const IS_LIVE = process.env.NEXT_PUBLIC_IS_LIVE === "true";

export default function WatchPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <div className="flex items-center gap-2 mb-3">
        {IS_LIVE && (
          <span className="btn-maroon inline-flex items-center gap-1.5 rounded-pill px-3 py-1 font-body font-bold text-[12px] text-white">
            <span className="live-dot h-1.5 w-1.5 rounded-full" />
            LIVE NOW
          </span>
        )}
        <p className="font-display text-[14px] tracking-widest text-ink/50 uppercase">
          Chin American Idol
        </p>
      </div>
      <h1 className="font-display text-[40px] leading-none text-ink uppercase mb-6">
        Watch The Show
      </h1>
      <LiveStreamPlayer />
      <p className="font-body text-[14px] text-ink/60 mt-6">
        {IS_LIVE
          ? "Streaming now — vote for your favorite while you watch."
          : "Not currently live. Check back at showtime, or catch up on the latest episode above."}
      </p>
    </div>
  );
}