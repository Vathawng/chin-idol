import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getContestant } from "@/lib/supabase/contestants";
import { getVotingStatus } from "@/lib/supabase/rounds";
import { checkCheckoutRateLimit } from "@/lib/rate-limit";
import { VOTE_PRICE_CENTS } from "@/lib/contestants";

// Best-effort client IP. Behind Vercel/most proxies the real client is the
// first entry of x-forwarded-for; x-real-ip is a fallback. Used only to rate
// limit checkout-session creation, so an occasional "unknown" is acceptable.
function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

export async function POST(req: NextRequest) {
  const { contestantId, quantity } = await req.json();

  if (!contestantId || !quantity || quantity < 1) {
    return NextResponse.json({ error: "Invalid vote request." }, { status: 400 });
  }

  // Voting is anonymous — the Stripe payment is the gate, no account needed.
  // We rate limit per IP so a script can't hammer this endpoint creating
  // checkout sessions, whether by a bot or someone double/triple-clicking
  // during a traffic spike. Checked first, before any other work.
  const allowed = await checkCheckoutRateLimit(clientIp(req));
  if (!allowed) {
    return NextResponse.json(
      { error: "You're voting a bit too fast — please wait a moment and try again." },
      { status: 429 }
    );
  }

  // Source of truth for whether voting is open — checked server-side so it
  // can't be bypassed by anyone hitting this route directly.
  const status = await getVotingStatus();
  if (!status.open) {
    return NextResponse.json(
      { error: "Voting is not currently open." },
      { status: 403 }
    );
  }

  // Look up the contestant server-side rather than trusting a name the
  // client sent — also confirms the id is real before charging anyone.
  const contestant = await getContestant(contestantId);
  if (!contestant) {
    return NextResponse.json({ error: "Contestant not found." }, { status: 404 });
  }

  const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL;

  // Stripe Checkout collects the payer's email itself in payment mode; we read
  // it back off the completed session in the webhook and store it on the vote.
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: VOTE_PRICE_CENTS,
          product_data: {
            name: `Chin American Idol vote — ${contestant.name}`,
          },
        },
        quantity,
      },
    ],
    metadata: {
      contestant_id: contestantId,
      vote_quantity: String(quantity),
      round_id: status.round.id,
    },
    success_url: `${origin}/vote/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/vote/cancel`,
  });

  return NextResponse.json({ url: session.url });
}
