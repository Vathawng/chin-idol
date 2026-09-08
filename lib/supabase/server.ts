// Admin client — service role key, server-only. Never expose to the browser.
// Used by the Stripe webhook (vote insert) and the IP rate limiter, both of
// which need to bypass RLS. Voting is anonymous, so there's no cookie-based
// user client anymore.
export function createAdminClient() {
  const { createClient: createSupabaseClient } = require("@supabase/supabase-js");
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
