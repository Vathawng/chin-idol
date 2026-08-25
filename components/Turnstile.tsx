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
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    if (!scriptLoaded || !containerRef.current || widgetId.current || !siteKey) return;
    if (!window.turnstile) return;

    widgetId.current = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      callback: (token: string) => onVerify(token),
      "expired-callback": () => onVerify(""),
      "error-callback": () => onVerify(""),
    });
  }, [scriptLoaded, onVerify]);

  // No site key configured yet (e.g. local dev before Cloudflare is set up)
  // — render nothing rather than crash. Supabase's own CAPTCHA enforcement
  // (once enabled in the dashboard) is the real gate; this widget is just
  // how a valid token gets produced.
  if (!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) return null;

  return (
    <>
      <Script
        src="https://challenge.cloudflare.com/turnstile/v0/api.js"
        strategy="afterInteractive"
        onLoad={() => setScriptLoaded(true)}
      />
      <div ref={containerRef} />
    </>
  );
}