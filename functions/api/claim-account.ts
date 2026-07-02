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
    for (let attempt = 0; attempt < 3; attempt++) {
      verifyData = await retrieveSession();
      if (!verifyData) {
        // API error — treat as not verified but keep retrying
        await new Promise((res) => setTimeout(res, 1500));
        continue;
      }
      const a = verifyData?.data?.attributes;
      lastPaymentStatus = a?.payment_status || "unknown";
      // Accept any of the "paid" indicators PayMongo uses across modes.
      // payment_status: "paid" | "unpaid" | "awaiting_payment" | "processing"
      // status: "open" | "completed" | "expired" | "awaiting_payment"
      isPaid =
        a?.payment_status === "paid" ||
        a?.status === "completed" ||
        a?.status === "paid" ||
        // Some test-mode flows mark payments as "processing" briefly before "paid"
        (a?.payment_status === "processing" && attempt < 2);
      if (isPaid) break;
      if (attempt < 2) await new Promise((res) => setTimeout(res, 1500));
    }

    if (!isPaid) {
      console.error("[claim-account] Session not paid after retries:", lastPaymentStatus);
      // TEMPORARY DEBUG: include the actual PayMongo response so we can see
      // what status fields PayMongo returns for a paid session.
      const debugInfo = {
        sessionId,
        payment_status: verifyData?.data?.attributes?.payment_status,
        status: verifyData?.data?.attributes?.status,
        attempts: 3,
      };
      return new Response(
        JSON.stringify({
          ok: false,
          error: "payment_not_verified",
          message: "Payment not confirmed yet. If you paid, please wait a moment and refresh, or contact support.",
          debug: debugInfo,
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
