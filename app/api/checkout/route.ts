import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { VOTE_PRICE_CENTS } from "@/lib/contestants";

export async function POST(req: NextRequest) {
  const { contestantId, contestantName, quantity } = await req.json();

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
            name: `America Chin Idol vote — ${contestantName || contestantId}`,
          },
        },
        quantity,
      },
    ],
    metadata: {
      contestant_id: contestantId,
      user_id: user.id,
      vote_quantity: String(quantity),
    },
    success_url: `${origin}/vote/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/vote/cancel`,
  });

  return NextResponse.json({ url: session.url });
}
