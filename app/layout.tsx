import type { Metadata } from "next";
import { Anton, Poppins } from "next/font/google";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";

const anton = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-anton-sc",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "America Chin Idol — Vote for Your Favorite Voice",
  description:
    "America Chin Idol is a singing competition spotlighting vocal talent from Chin State, Myanmar. Register, watch, and vote for your favorite contestant.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${anton.variable} ${poppins.variable}`}>
      <body className="font-body bg-white text-ink min-h-screen flex flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
