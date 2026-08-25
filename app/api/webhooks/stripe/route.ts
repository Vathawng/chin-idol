import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/server";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${err.message}` },
      { status: 400 }
    );
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const { contestant_id, user_id, vote_quantity, round_id } = session.metadata || {};

    if (contestant_id && user_id && vote_quantity) {
      const supabase = createAdminClient();

      // Idempotent insert — the unique constraint on stripe_session_id
      // (see supabase/schema.sql) means a retried webhook won't double-credit.
      await supabase.from("votes").insert({
        user_id,
        contestant_id,
        round_id: round_id || null,
        quantity: parseInt(vote_quantity, 10),
        amount_cents: session.amount_total,
        stripe_session_id: session.id,
        status: "paid",
      });
    }
  }

  return NextResponse.json({ received: true });
}