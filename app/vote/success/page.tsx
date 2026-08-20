import Link from "next/link";

export default function VoteSuccessPage() {
  return (
    <div className="mx-auto max-w-md px-6 py-24 text-center">
      <span className="inline-flex h-16 w-16 items-center justify-center rounded-full btn-maroon text-white text-2xl mb-6">
        ✓
      </span>
      <h1 className="font-display text-[32px] leading-none text-ink uppercase mb-3">
        Vote Counted!
      </h1>
      <p className="font-body text-[16px] text-ink/60 mb-8">
        Thank you for supporting Chin American Idol. Your vote has been
        recorded.
      </p>
      <div className="flex justify-center gap-3">
        <Link
          href="/#contestants"
          className="btn-maroon rounded-pill h-11 px-6 flex items-center font-body font-bold text-[16px] text-white"
        >
          Vote Again
        </Link>
        <Link
          href="/"
          className="btn-outline-chrome rounded-pill h-11 px-6 flex items-center font-body font-bold text-[16px] text-ink"
        >
          Back Home
        </Link>
      </div>
    </div>
  );
}