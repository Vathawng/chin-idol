"use client";

import { Suspense, useCallback, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Turnstile from "@/components/Turnstile";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCaptcha = useCallback((token: string) => setCaptchaToken(token), []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
      options: { captchaToken: captchaToken || undefined },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push(next);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-md px-6 py-24">
      <div className="card-border rounded-lg p-8 shadow-sm">
        <p className="font-display text-[14px] tracking-widest text-ink/50 uppercase mb-2">
          Chin American Idol
        </p>
        <h1 className="font-display text-[28px] leading-none text-ink uppercase mb-6">
          Welcome Back
        </h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <label className="block">
            <span className="block font-body text-[12px] font-bold uppercase tracking-wide text-ink/60 mb-1.5">
              Email
            </span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md card-border px-4 py-3 font-body text-ink focus:outline-none focus:border-[#8a2532] transition-colors"
            />
          </label>
          <label className="block">
            <span className="block font-body text-[12px] font-bold uppercase tracking-wide text-ink/60 mb-1.5">
              Password
            </span>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md card-border px-4 py-3 font-body text-ink focus:outline-none focus:border-[#8a2532] transition-colors"
            />
          </label>
          <Turnstile onVerify={handleCaptcha} />
          {error && <p className="font-body text-sm text-[#8a2532]">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="btn-maroon w-full rounded-pill h-11 font-body font-bold text-[16px] text-white disabled:opacity-60"
          >
            {loading ? "Logging in…" : "Log In"}
          </button>
        </form>

        <p className="text-center font-body text-[14px] text-ink/60 mt-6">
          New to Chin American Idol?{" "}
          <Link
            href={`/signup${next !== "/" ? `?next=${encodeURIComponent(next)}` : ""}`}
            className="font-bold text-[#8a2532] hover:underline"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}