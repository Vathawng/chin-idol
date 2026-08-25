"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: Record<string, unknown>) => string;
      reset: (widgetId?: string) => void;
    };
  }
}

export default function Turnstile({ onVerify }: { onVerify: (token: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const [ready, setReady] = useState(false);

  // Poll for window.turnstile instead of relying on <Script>'s onLoad —
  // Next.js dedupes identical script tags across the app, so onLoad doesn't
  // reliably re-fire if this script was already loaded from an earlier page
  // in the same session. Polling works regardless of when/how it loaded.
  useEffect(() => {
    if (window.turnstile) {
      setReady(true);
      return;
    }
    const interval = setInterval(() => {
      if (window.turnstile) {
        setReady(true);
        clearInterval(interval);
      }
    }, 100);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    if (!ready || !containerRef.current || widgetId.current || !siteKey || !window.turnstile) return;

    widgetId.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      callback: (token: string) => onVerify(token),
      "expired-callback": () => onVerify(""),
      "error-callback": () => onVerify(""),
    });
  }, [ready, onVerify]);

  // No site key configured yet (e.g. local dev before Cloudflare is set up)
  // — render nothing rather than crash. Supabase's own CAPTCHA enforcement
  // (once enabled in the dashboard) is the real gate; this widget is just
  // how a valid token gets produced.
  if (!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) return null;

  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" />
      <div ref={containerRef} />
    </>
  );
}