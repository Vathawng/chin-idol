import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="border-t border-chrome/35 bg-white">
      <div className="mx-auto max-w-[1440px] px-6 sm:px-12 lg:px-32 py-16 flex flex-col lg:flex-row lg:items-start justify-between gap-12">
        <div>
          <h2 className="font-display text-[32px] leading-none text-ink uppercase">
            America Chin Idol
          </h2>
          <p className="font-body text-[16px] text-ink mt-3 max-w-sm">
            Celebrating the voices of Chin State, Myanmar — one vote at a time.
          </p>
          <p className="font-body text-[16px] text-ink mt-6">
            © {new Date().getFullYear()} America Chin Idol
          </p>
          <Image
            src="/images/logo.png"
            alt="America Chin Idol"
            width={88}
            height={86}
            className="h-[70px] w-auto mt-6"
          />
        </div>

        <div>
          <nav className="flex flex-wrap gap-x-10 gap-y-2">
            <Link href="/" className="font-display text-[24px] sm:text-[32px] text-ink uppercase hover:text-maroon-from transition-colors">
              Home
            </Link>
            <Link href="/watch" className="font-display text-[24px] sm:text-[32px] text-ink uppercase hover:text-maroon-from transition-colors">
              Live
            </Link>
            <Link href="/leaderboard" className="font-display text-[24px] sm:text-[32px] text-ink uppercase hover:text-maroon-from transition-colors">
              Vote
            </Link>
            <Link href="/#contestants" className="font-display text-[24px] sm:text-[32px] text-ink uppercase hover:text-maroon-from transition-colors">
              Contestants
            </Link>
          </nav>
          <p className="font-body text-[16px] text-ink mt-6">
            For inquiries, please email{" "}
            <a href="mailto:cyona@info.org" className="underline hover:text-maroon-from">
              cyona@info.org
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
