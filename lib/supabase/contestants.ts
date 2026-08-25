import { createPublicClient } from "@/lib/supabase/public";
import type { Contestant } from "@/lib/contestants";

// Public read — RLS policy "contestants are public" allows this with just
// the anon key, no auth required. Used on the homepage and contestant list.
export async function getContestants(): Promise<Contestant[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("contestants")
    .select("id, name, hometown, bio, image_url")
    .order("sort_order", { ascending: true });

  if (error || !data) {
    console.error("Failed to load contestants:", error);
    return [];
  }
  return data;
}

export async function getContestant(id: string): Promise<Contestant | null> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("contestants")
    .select("id, name, hometown, bio, image_url")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data;
}