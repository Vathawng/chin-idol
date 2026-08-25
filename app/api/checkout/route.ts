import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { getContestant } from "@/lib/supabase/contestants";
import { getVotingStatus } from "@/lib/supabase/rounds";
import { checkCheckoutRateLimit } from "@/lib/rate-limit";
import { VOTE_PRICE_CENTS } from "@/lib/contestants";

export async function POST(req: NextRequest) {
  const { contestantId, quantity } = await req.json();

  if (!contestantId || !quantity || quantity < 1) {
    return NextResponse.json({ error: "Invalid vote request." }, { status: 400 });
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Please log in before voting." },
      { status: 401 }
    );
  }

  // Checked right after auth, before any other work — this is what
  // protects the endpoint from being hammered, whether by a bot or by
  // someone double/triple-clicking during a traffic spike.
  const allowed = await checkCheckoutRateLimit(user.id);
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

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: user.email ?? undefined,
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
      user_id: user.id,
      vote_quantity: String(quantity),
      round_id: status.round.id,
    },
    success_url: `${origin}/vote/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/vote/cancel`,
  });

  return NextResponse.json({ url: session.url });
}