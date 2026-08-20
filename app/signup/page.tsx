"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/` },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    // With email confirmation turned off in Supabase, signUp() returns a
    // live session immediately — go straight in. If confirmation is ever
    // turned back on, no session comes back yet, so fall back to the
    // "check your inbox" screen instead.
    if (data.session) {
      router.push("/");
      router.refresh();
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <AuthShell title="Check Your Inbox">
        <p className="font-body text-[16px] text-ink/70 leading-relaxed">
          We sent a confirmation link to <span className="font-bold text-ink">{email}</span>.
          Click it to activate your account, then come back and log in to start voting.
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Create Your Account" subtitle="Register once, vote as many times as you like.">
      <form onSubmit={handleSubmit} className="space-y-5">
        <Field label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" required />
        <Field
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          minLength={6}
          required
        />
        {error && <p className="font-body text-sm text-[#8a2532]">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="btn-maroon w-full rounded-pill h-11 font-body font-bold text-[16px] text-white disabled:opacity-60"
        >
          {loading ? "Creating account…" : "Sign Up"}
        </button>
      </form>
      <p className="text-center font-body text-[14px] text-ink/60 mt-6">
        Already registered?{" "}
        <Link href="/login" className="font-bold text-[#8a2532] hover:underline">
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}

function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-md px-6 py-24">
      <div className="card-border rounded-lg p-8 shadow-sm">
        <p className="font-display text-[14px] tracking-widest text-ink/50 uppercase mb-2">
          Chin American Idol
        </p>
        <h1 className="font-display text-[28px] leading-none text-ink uppercase mb-2">{title}</h1>
        {subtitle && <p className="font-body text-[14px] text-ink/60 mb-6">{subtitle}</p>}
        {!subtitle && <div className="mb-6" />}
        {children}
      </div>
    </div>
  );
}

function Field({
  label,
  type,
  value,
  onChange,
  ...rest
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  [key: string]: any;
}) {
  return (
    <label className="block">
      <span className="block font-body text-[12px] font-bold uppercase tracking-wide text-ink/60 mb-1.5">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md card-border px-4 py-3 font-body text-ink placeholder-ink/30 focus:outline-none focus:border-[#8a2532] transition-colors"
        {...rest}
      />
    </label>
  );
}