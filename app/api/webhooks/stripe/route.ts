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
    const { contestant_id, vote_quantity, round_id } = session.metadata || {};

    if (contestant_id && vote_quantity) {
      const supabase = createAdminClient();

      // Anonymous voting — there's no user_id. We record the email Stripe
      // collected at checkout instead, so a paid vote is still traceable.
      const { error } = await supabase.from("votes").insert({
        contestant_id,
        round_id: round_id || null,
        quantity: parseInt(vote_quantity, 10),
        amount_cents: session.amount_total,
        voter_email: session.customer_details?.email ?? null,
        stripe_session_id: session.id,
        status: "paid",
      });

      if (error) {
        // 23505 = unique_violation on stripe_session_id. The vote for this
        // checkout session is already recorded — this is a duplicate/retried
        // delivery, which is success, not failure. Acknowledge so Stripe
        // stops retrying (this is what keeps the webhook idempotent).
        if (error.code === "23505") {
          return NextResponse.json({ received: true, duplicate: true });
        }

        // Any other error means a PAID vote did NOT get recorded. Return 500
        // so Stripe retries delivery (up to its retry window) instead of
        // silently dropping the vote, and log it loudly so it can be alerted
        // on. Previously this error was swallowed and the webhook returned
        // 200, so a paid-but-unrecorded vote vanished without a trace.
        console.error(
          "Vote insert failed for Stripe session",
          session.id,
          "-",
          error.message,
          error
        );
        return NextResponse.json(
          { error: "Failed to record vote." },
          { status: 500 }
        );
      }
    }
  }

  return NextResponse.json({ received: true });
}