/**
 * Only allow redirecting to a real in-app path after login/signup.
 * Without this check, a `next` value like "https://evil.com" or
 * "//evil.com" (protocol-relative) would send someone off-site right
 * after they authenticate — a classic open-redirect phishing setup.
 */
export function safeRedirect(next: string | null): string {
    if (!next) return "/";
    if (!next.startsWith("/")) return "/";
    if (next.startsWith("//")) return "/"; // protocol-relative URL, e.g. //evil.com
    return next;
  }