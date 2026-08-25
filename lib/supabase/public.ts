import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Unlike lib/supabase/server.ts, this never touches cookies() — which means
// any Server Component using it is eligible for static rendering + ISR
// instead of being forced fully dynamic on every request. Only use this for
// data that's genuinely public (contestants, voting round schedule) —
// never for anything that depends on who's logged in.
export function createPublicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}