import Link from "next/link";

// Voting is anonymous — no account gate. `votingOpen` only tweaks the label.
export default function VoteBannerButton({ votingOpen }: { votingOpen: boolean }) {
  return (
    <Link
      href="/#contestants"
      className="btn-maroon rounded-pill h-10 px-6 flex items-center font-body font-bold text-[16px] text-white shrink-0"
    >
      {votingOpen ? "Cast Your Vote" : "See Contestants"}
    </Link>
  );
}
