// Client-safe types + still-mock panel data. Real contestant data now comes
// from Supabase — see lib/supabase/contestants.ts. This file has no
// server-only imports, so it's safe to import from Client Components too.

export type Contestant = {
  id: string;
  name: string;
  hometown: string;
  bio: string;
  image_url: string;
};

export type PanelMember = {
  id: string;
  name: string;
  role: string;
  image_url: string;
};

export const MOCK_PANEL: PanelMember[] = [
  { id: "van-ceu-uk", name: "Van Ceu Uk", role: "Judge", image_url: "https://gwninjlduynvebcjongy.supabase.co/storage/v1/object/public/contestant-photo/panel/van-ceu-uk.jpg" },
  { id: "esther-van-hnem-sung", name: "Esther Van Hnem Sung", role: "Judge", image_url: "https://gwninjlduynvebcjongy.supabase.co/storage/v1/object/public/contestant-photo/panel/esther-van-hnem-sung.jpg" },
  { id: "simon-ci-lian", name: "Simon Ci Lian", role: "Judge", image_url: "https://gwninjlduynvebcjongy.supabase.co/storage/v1/object/public/contestant-photo/panel/simon-ci-lian.jpg" },
  { id: "steven-cung-bik", name: "Steven Cung Bik", role: "Host", image_url: "https://gwninjlduynvebcjongy.supabase.co/storage/v1/object/public/contestant-photo/panel/steven-cung-bik.jpg" },
];

const PRICE_PER_VOTE_USD = 1;
export const VOTE_PRICE_CENTS = PRICE_PER_VOTE_USD * 100;