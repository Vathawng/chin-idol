import Link from "next/link";
import PersonPhoto from "./PersonPhoto";
import type { Contestant } from "@/lib/contestants";

export default function ContestantCard({ contestant }: { contestant: Contestant }) {
  return (
    <div className="w-[260px] shrink-0 snap-start">
      <Link href={`/contestants/${contestant.id}`} className="block">
        <PersonPhoto
          src={contestant.image_url}
          name={contestant.name}
          className="w-[260px] h-[325px]"
        />
      </Link>
      <h3 className="font-display text-[24px] leading-none text-ink uppercase mt-4">
        {contestant.name}
      </h3>
      <p className="font-body text-[16px] text-ink mt-2">{contestant.hometown}</p>
      <Link
        href={`/contestants/${contestant.id}`}
        className="btn-maroon inline-flex items-center justify-center rounded-pill h-8 w-24 mt-4 font-body font-bold text-[16px] text-white"
      >
        Vote
      </Link>
    </div>
  );
}
