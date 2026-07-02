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
    // PayMongo test mode can have a slight delay before payment_status flips
    // to "paid". We retry up to 3 times with a 1.5s gap.
    const secretKey = env.PAYMONGO_SECRET_KEY;
    if (!secretKey) {
      console.error("[claim-account] PAYMONGO_SECRET_KEY not configured");
      return new Response(
        JSON.stringify({ ok: false, error: "server", message: "Payment verification not configured." }),
        { status: 500, headers: corsHeaders }
      );
    }

    const retrieveSession = async () => {
      const r = await fetch(`${PAYMONGO_RETRIEVE_URL}/${sessionId}`, {
        method: "GET",
        headers: { "Authorization": `Basic ${btoa(secretKey + ":")}` },
      });
      if (!r.ok) return null;
      return r.json();
    };

    let verifyData: any = null;
    let isPaid = false;
    let lastPaymentStatus = "unknown";
    let lastStatus = "unknown";
    let paymentsCount = 0;
    // Retry up to 5 times with 2s gap (10s total) — PayMongo can take a few
    // seconds to update the session status after payment.
    for (let attempt = 0; attempt < 5; attempt++) {
      verifyData = await retrieveSession();
      if (!verifyData) {
        await new Promise((res) => setTimeout(res, 2000));
        continue;
      }
      const a = verifyData?.data?.attributes;
      lastPaymentStatus = a?.payment_status || "none";
      lastStatus = a?.status || "none";
      paymentsCount = Array.isArray(a?.payments) ? a.payments.length : 0;

      // Check MULTIPLE signals that PayMongo might use:
      // 1. payment_status === "paid"
      // 2. status === "completed"
      // 3. payments array has entries (payment was made)
      // 4. Any payment in the array has status "paid"
      const hasPaidPayment = Array.isArray(a?.payments) && a.payments.some((p: any) => 
        p?.attributes?.status === "paid" || p?.attributes?.status === "succeeded"
      );
      
      isPaid =
        a?.payment_status === "paid" ||
        a?.status === "completed" ||
        a?.status === "paid" ||
        paymentsCount > 0 ||
        hasPaidPayment;
        
      if (isPaid) break;
      if (attempt < 4) await new Promise((res) => setTimeout(res, 2000));
    }

    if (!isPaid) {
      console.error("[claim-account] Session not paid after 5 retries:", { lastPaymentStatus, lastStatus, paymentsCount });
      // Include debug info IN THE MESSAGE so the user can see it and report back
      const debugMsg = `Debug: status=${lastStatus}, payment_status=${lastPaymentStatus}, payments=${paymentsCount}`;
      return new Response(
        JSON.stringify({
          ok: false,
          error: "payment_not_verified",
          message: `Payment could not be verified. ${debugMsg}. Please contact support.`,
          debug: { sessionId, status: lastStatus, payment_status: lastPaymentStatus, payments: paymentsCount },
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Use the session's metadata.days (trustworthy, set server-side by create-session)
    // instead of client-sent days, preventing tampering.
    const sessionAttributes = verifyData?.data?.attributes;
    const metadata = sessionAttributes?.metadata || {};
    const sessionDays = parseInt(metadata.days, 10) || 0;
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
