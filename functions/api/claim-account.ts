// Cloudflare Pages Function — verify PayMongo payment, then claim account.
//
// Flow:
//   1. Receive { email, days, sessionId } from the dashboard (after PayMongo redirect)
//   2. Verify the session is actually paid by calling PayMongo's API
//   3. If paid → forward to gatekeeper /api/claim-account (Firestore transaction)
//   4. If not paid → reject with "payment not verified"
//
// This prevents someone from curling the endpoint without paying — the
// PayMongo secret key lives on the customer site (Cloudflare env), so the
// gatekeeper never needs it.

const GATEKEEPER_CLAIM_URL = "https://nuviostreamapi.vercel.app/api/claim-account";
const PAYMONGO_RETRIEVE_URL = "https://api.paymongo.com/v1/checkout_sessions";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Content-Type": "application/json",
};

export const onRequestOptions = async () => {
  return new Response(null, { status: 200, headers: corsHeaders });
};

export const onRequestPost = async ({ request, env }: { request: Request; env: { PAYMONGO_SECRET_KEY: string } }) => {
  try {
    let body: any;
    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({ ok: false, error: "bad_request", message: "Invalid JSON body." }),
        { status: 400, headers: corsHeaders }
      );
    }

    const email = (body?.email || "").trim().toLowerCase();
    const days = parseInt(body?.days, 10) || 30;
    const sessionId = (body?.sessionId || "").trim();

    if (!email) {
      return new Response(
        JSON.stringify({ ok: false, error: "bad_request", message: "Missing email." }),
        { status: 400, headers: corsHeaders }
      );
    }
    if (!sessionId) {
      return new Response(
        JSON.stringify({ ok: false, error: "no_session", message: "Missing payment session. Please contact support." }),
        { status: 400, headers: corsHeaders }
      );
    }

    // ── STEP 1: Verify the PayMongo session is paid ──
    const secretKey = env.PAYMONGO_SECRET_KEY;
    if (!secretKey) {
      console.error("[claim-account] PAYMONGO_SECRET_KEY not configured");
      return new Response(
        JSON.stringify({ ok: false, error: "server", message: "Payment verification not configured." }),
        { status: 500, headers: corsHeaders }
      );
    }

    const verifyRes = await fetch(`${PAYMONGO_RETRIEVE_URL}/${sessionId}`, {
      method: "GET",
      headers: { "Authorization": `Basic ${btoa(secretKey + ":")}` },
    });

    if (!verifyRes.ok) {
      console.error("[claim-account] PayMongo verify failed:", verifyRes.status);
      return new Response(
        JSON.stringify({ ok: false, error: "payment_not_verified", message: "Payment could not be verified. If you paid, please contact support for a refund." }),
        { status: 400, headers: corsHeaders }
      );
    }

    const verifyData = await verifyRes.json();
    const sessionAttributes = verifyData?.data?.attributes;
    const paymentStatus = sessionAttributes?.payment_status;
    // PayMongo statuses: "paid", "unpaid", "awaiting_payment", etc.
    // Also check the session-level status (could be "completed").
    const isPaid = paymentStatus === "paid" || sessionAttributes?.status === "completed";

    if (!isPaid) {
      console.error("[claim-account] Session not paid:", paymentStatus);
      return new Response(
        JSON.stringify({ ok: false, error: "payment_not_verified", message: "Payment not confirmed. If you paid, please contact support." }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Optional: verify the amount matches the plan (prevents someone paying ₱19
    // for a ₱49 plan by tampering with the session). The metadata.plan tells us
    // what plan they selected; we can cross-check the amount.
    const metadata = sessionAttributes?.metadata || {};
    const sessionDays = parseInt(metadata.days, 10) || 0;
    // Use the session's days if available (more trustworthy than client-sent days)
    const finalDays = sessionDays > 0 ? sessionDays : days;

    // ── STEP 2: Payment verified — forward to gatekeeper for atomic assignment ──
    const upstream = await fetch(GATEKEEPER_CLAIM_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, days: finalDays }),
    });

    const text = await upstream.text();
    return new Response(text, {
      status: upstream.status,
      headers: corsHeaders,
    });
  } catch (err) {
    console.error("[claim-account proxy] error:", err);
    return new Response(
      JSON.stringify({ ok: false, error: "server", message: "Server error. Please try again." }),
      { status: 500, headers: corsHeaders }
    );
  }
};
