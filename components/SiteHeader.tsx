"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { label: "HOME", href: "/" },
  { label: "LIVE", href: "/watch" },
  { label: "VOTE", href: "/leaderboard" },
  { label: "CONTESTANTS", href: "/#contestants" },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <header
      className={
        isHome
          ? "absolute top-0 inset-x-0 z-40"
          : "sticky top-0 z-40 bg-gradient-to-r from-[#060729] to-[#17183f]"
      }
    >
      <div className="mx-auto max-w-[1440px] px-6 sm:px-12 lg:px-32 h-[110px] flex items-center justify-between">
        <div className="flex items-center gap-16">
          <Link href="/" className="block shrink-0">
            <Image
              src="/images/logo.png"
              alt="America Chin Idol"
              width={88}
              height={86}
              className="h-[70px] sm:h-[86px] w-auto"
              priority
            />
          </Link>
          <nav className="hidden md:flex items-center gap-12">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="font-body font-bold text-[16px] text-white hover:text-chrome transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-6">
          <Link
            href="/login"
            className="hidden sm:inline font-body font-bold text-[16px] text-white hover:text-chrome transition-colors"
          >
            Log In
          </Link>
          <div className="hidden sm:block h-6 w-px bg-white/40" />
          <Link
            href="/signup"
            className="btn-maroon rounded-pill px-6 py-2 font-body font-bold text-[16px] text-white"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </header>
  );
}
