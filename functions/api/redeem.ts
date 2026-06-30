// Cloudflare Pages Function — proxy promo-code redemption to the gatekeeper.
//
// The gatekeeper (nuviostreamapi.vercel.app/api/redeem) performs the atomic
// Firestore transaction: validate code → check availability → assign account
// → set expiry → DELETE the code (single-use).
//
// We proxy through here (instead of calling the gatekeeper directly from the
// browser) so that:
//   1. The customer site stays same-origin (no CORS surprises in production).
//   2. We can add server-side rate-limiting / logging later without touching
//      the client.
//
// POST /api/redeem  { code: "NUVIO-XXXXXX", email: "customer@gmail.com" }
// → forwards to https://nuviostreamapi.vercel.app/api/redeem
// → returns whatever the gatekeeper returns.

const GATEKEEPER_REDEEM_URL = "https://nuviostreamapi.vercel.app/api/redeem";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Content-Type": "application/json",
};

export const onRequestOptions = async () => {
  return new Response(null, { status: 200, headers: corsHeaders });
};

export const onRequestPost = async ({ request }: { request: Request }) => {
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

    const code = (body?.code || "").trim().toUpperCase();
    const email = (body?.email || "").trim().toLowerCase();

    if (!code || !email) {
      return new Response(
        JSON.stringify({ ok: false, error: "bad_request", message: "Missing code or email." }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Forward to the gatekeeper. It runs the Firestore transaction.
    const upstream = await fetch(GATEKEEPER_REDEEM_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, email }),
    });

    // Pass the gatekeeper's JSON response straight through.
    const text = await upstream.text();
    return new Response(text, {
      status: upstream.status,
      headers: corsHeaders,
    });
  } catch (err) {
    console.error("[redeem proxy] error:", err);
    return new Response(
      JSON.stringify({ ok: false, error: "server", message: "Server error. Please try again." }),
      { status: 500, headers: corsHeaders }
    );
  }
};
