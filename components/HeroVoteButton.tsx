import Link from "next/link";

// Voting is anonymous — no account gate, so this is just a link to the
// contestant list where the vote widgets live.
export default function HeroVoteButton() {
  return (
    <Link
      href="/#contestants"
      className="btn-maroon rounded-pill h-10 px-6 flex items-center font-body font-bold text-[16px] text-white"
    >
      Vote Now
    </Link>
  );
}
