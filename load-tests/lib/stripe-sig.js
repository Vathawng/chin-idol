// Locally sign a Stripe webhook payload so we can load-test
// /api/webhooks/stripe WITHOUT going through Stripe at all.
//
// The route verifies the payload with stripe.webhooks.constructEvent(), which
// checks a `t=<timestamp>,v1=<hmac>` signature header where the HMAC is
// HMAC-SHA256(`${timestamp}.${payload}`) keyed by the endpoint's webhook
// secret (whsec_...). We reproduce exactly that here.
//
// This exercises the real signature verification, the real event handling, and
// the real votes insert / idempotency path — the parts that actually get
// stressed when a burst of paid votes lands during a round.

import crypto from "k6/crypto";

// Build a checkout.session.completed event body with the metadata the route
// reads (contestant_id, user_id, vote_quantity, round_id) and a session id.
export function buildEvent({ sessionId, contestantId, userId, quantity, roundId, amountCents }) {
  return JSON.stringify({
    id: `evt_load_${sessionId}`,
    object: "event",
    type: "checkout.session.completed",
    data: {
      object: {
        id: sessionId,
        object: "checkout.session",
        amount_total: amountCents,
        metadata: {
          contestant_id: contestantId,
          user_id: userId,
          vote_quantity: String(quantity),
          round_id: roundId || "",
        },
      },
    },
  });
}

// Produce the value for the `Stripe-Signature` header.
export function signPayload(payload, secret, timestamp) {
  const t = timestamp || Math.floor(Date.now() / 1000);
  const signedPayload = `${t}.${payload}`;
  const v1 = crypto.hmac("sha256", secret, signedPayload, "hex");
  return `t=${t},v1=${v1}`;
}
