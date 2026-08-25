import { createAdminClient } from "@/lib/supabase/server";

const WINDOW_SECONDS = 60;
const MAX_ATTEMPTS_PER_WINDOW = 10;

/**
 * Sliding-window rate limit on checkout attempts, per logged-in user.
 * Allows plenty of room for normal use (voting for several contestants,
 * retrying after a card decline) while blocking a script hammering the
 * endpoint. Returns true if this attempt is allowed (and records it),
 * false if the user should be rejected.
 */
export async function checkCheckoutRateLimit(userId: string): Promise<boolean> {
  const supabase = createAdminClient();
  const windowStart = new Date(Date.now() - WINDOW_SECONDS * 1000).toISOString();

  const { count, error } = await supabase
    .from("checkout_attempts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", windowStart);

  // If the check itself fails, fail open rather than blocking legitimate
  // voters over an infrastructure hiccup — this is a safety net, not the
  // primary defense.
  if (error) {
    console.error("Rate limit check failed:", error);
    return true;
  }

  if ((count ?? 0) >= MAX_ATTEMPTS_PER_WINDOW) {
    return false;
  }

  await supabase.from("checkout_attempts").insert({ user_id: userId });

  // Opportunistic cleanup so this table doesn't grow forever — cheap,
  // and doesn't need a separate cron job.
  const cleanupBefore = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  await supabase.from("checkout_attempts").delete().lt("created_at", cleanupBefore);

  return true;
}