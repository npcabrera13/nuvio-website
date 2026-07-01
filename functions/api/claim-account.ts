// Cloudflare Pages Function — proxy post-payment account claim to the gatekeeper.
//
// The gatekeeper (nuviostreamapi.vercel.app/api/claim-account) performs the
// atomic Firestore transaction: check availability → assign account → set expiry.
// This eliminates the race condition where two customers pay simultaneously for
// the last account (client-side assignment was last-write-wins; the transaction
// guarantees only one customer gets it, the other gets a clear "no accounts"
// response so they see the refund banner instead of a silent failure).
//
// POST /api/claim-account  { email: "customer@gmail.com", days: 30 }
// → forwards to https://nuviostreamapi.vercel.app/api/claim-account
// → returns whatever the gatekeeper returns.

const GATEKEEPER_CLAIM_URL = "https://nuviostreamapi.vercel.app/api/claim-account";

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

    const email = (body?.email || "").trim().toLowerCase();
    const days = parseInt(body?.days, 10) || 30;

    if (!email) {
      return new Response(
        JSON.stringify({ ok: false, error: "bad_request", message: "Missing email." }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Forward to the gatekeeper. It runs the Firestore transaction.
    const upstream = await fetch(GATEKEEPER_CLAIM_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, days }),
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
