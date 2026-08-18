import Link from "next/link";

export default function VoteCancelPage() {
  return (
    <div className="mx-auto max-w-md px-6 py-24 text-center">
      <span className="inline-flex h-16 w-16 items-center justify-center rounded-full card-border text-[#8a2532] text-2xl mb-6">
        ×
      </span>
      <h1 className="font-display text-[32px] leading-none text-ink uppercase mb-3">
        Checkout Cancelled
      </h1>
      <p className="font-body text-[16px] text-ink/60 mb-8">
        No worries — no payment was made. You can try again whenever you're ready.
      </p>
      <Link
        href="/"
        className="btn-maroon rounded-pill h-11 px-6 inline-flex items-center font-body font-bold text-[16px] text-white"
      >
        Back to Contestants
      </Link>
    </div>
  );
}
