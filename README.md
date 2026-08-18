# America Chin Idol

Rebuilt from scratch to replicate the Figma design exactly.
**Stack:** Next.js 14 (App Router) · TypeScript · Tailwind · Supabase (auth + DB) · Stripe Checkout

## Design fidelity

- **Fonts:** Anton SC (headings, all caps) + Poppins (body/nav/buttons) — both loaded
  via `next/font/google`, matching the Figma type styles exactly.
- **Colors:** sampled directly from the Figma file —
  maroon button gradient `#8a2532 → #5a1620`, navy banner gradient `#060729 → #17183f`,
  translucent gold-ish border `rgba(201,154,59,0.35)` used on every card/button/pill,
  white page background, `#1e1e1e` body text.
- **Layout:** hero with transparent overlay header (matches the Figma nav-on-hero
  treatment), contestant card grid, circular panel photos, navy "Cast Your Vote" banner,
  footer — all built responsively rather than at fixed pixel coordinates, but at the
  same proportions or as close as I could measure from a Figma page not built with clear guardrails.

## ⚠️ Photos not included

I couldn't fetch images directly from Figma's asset servers from this environment.
The **hero photo** and **logo** are the same files from earlier in this project, already
included. The **8 contestant/panel photos** are placeholders (they render as initials
on a maroon gradient until you add real files).

To finish it: in Figma, select each photo layer → right-click → **Export** → PNG/JPG,
then save with these exact filenames:

```
public/images/contestants/benjamin-sum.jpg
public/images/contestants/esther-dawt-chin-sung.jpg
public/images/contestants/angela-van-ro-sung.jpg
public/images/contestants/joshua-van.jpg
public/images/panel/van-ceu-uk.jpg
public/images/panel/esther-van-hnem-sung.jpg
public/images/panel/simon-ci-lian.jpg
public/images/panel/steven-cung-bik.jpg
```

They'll appear automatically — no code changes needed.

## Setup

1. `npm install`
2. Create a Supabase project, run `supabase/schema.sql` in the SQL editor.
3. Create/access a Stripe account, set up a webhook at
   `/api/webhooks/stripe` subscribed to `checkout.session.completed`.
4. `cp .env.example .env.local` and fill in the values.
5. `npm run dev`

Contestant data currently lives in `lib/contestants.ts` (mock). Swap for a
Supabase query against `contestant_vote_totals` once contestants are seeded
in the database.

## Livestream

Set `NEXT_PUBLIC_STREAM_PLATFORM` to `youtube` or `facebook` in your env,
plus the matching channel ID / video URL, and flip `NEXT_PUBLIC_IS_LIVE=true`
right before a broadcast. See inline comments in `components/LiveStreamPlayer.tsx`.
