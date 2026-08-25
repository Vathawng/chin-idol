"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function HeroVoteButton() {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setLoggedIn(!!data.user));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoggedIn(!!session);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <Link
      href={loggedIn ? "/#contestants" : "/signup"}
      className="btn-maroon rounded-pill h-10 px-6 flex items-center font-body font-bold text-[16px] text-white"
    >
      {loggedIn ? "Vote Now" : "Register to Vote"}
    </Link>
  );
}