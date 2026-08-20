"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { label: "HOME", href: "/" },
  { label: "LIVE", href: "/watch" },
  { label: "CONTESTANTS", href: "/#contestants" },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header
      className={`${isHome ? "absolute top-0 inset-x-0" : "sticky top-0"} z-40 ${
        !isHome || menuOpen ? "bg-gradient-to-r from-[#060729] to-[#17183f]" : ""
      }`}
    >
      <div className="mx-auto max-w-[1440px] px-6 sm:px-12 lg:px-32 h-[110px] flex items-center justify-between">
        <div className="flex items-center gap-16">
          <Link href="/" className="block shrink-0" onClick={() => setMenuOpen(false)}>
            <Image
              src="/images/logo.png"
              alt="Chin American Idol"
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

        {/* Desktop right side */}
        <div className="hidden md:flex items-center gap-6">
          <Link
            href="/login"
            className="font-body font-bold text-[16px] text-white hover:text-chrome transition-colors"
          >
            Log In
          </Link>
          <div className="h-6 w-px bg-white/40" />
          <Link
            href="/signup"
            className="btn-maroon rounded-pill px-6 py-2 font-body font-bold text-[16px] text-white"
          >
            Sign Up
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          className="md:hidden flex flex-col justify-center items-center gap-1.5 h-10 w-10"
        >
          <span
            className={`block h-0.5 w-7 bg-white transition-transform duration-200 ${
              menuOpen ? "translate-y-2 rotate-45" : ""
            }`}
          />
          <span
            className={`block h-0.5 w-7 bg-white transition-opacity duration-200 ${
              menuOpen ? "opacity-0" : "opacity-100"
            }`}
          />
          <span
            className={`block h-0.5 w-7 bg-white transition-transform duration-200 ${
              menuOpen ? "-translate-y-2 -rotate-45" : ""
            }`}
          />
        </button>
      </div>

      {/* Mobile menu panel */}
      {menuOpen && (
        <div className="md:hidden px-6 pb-8 pt-2">
          <nav className="flex flex-col gap-5">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="font-body font-bold text-[18px] text-white hover:text-chrome transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <div className="h-px w-full bg-white/20 my-1" />
            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              className="font-body font-bold text-[18px] text-white hover:text-chrome transition-colors"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              onClick={() => setMenuOpen(false)}
              className="btn-maroon rounded-pill px-6 py-3 font-body font-bold text-[16px] text-white text-center"
            >
              Sign Up
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}