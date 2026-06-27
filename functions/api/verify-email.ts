// Cloudflare Pages Function — verifies the signed JWT token (HMAC)
// NO Firestore reads. Just verifies the signature and returns the tokenId.

interface Env {
  VERIFICATION_SECRET: string;
}

/** Verify an HMAC-SHA256 signature using Web Crypto API */
async function verifySignature(payload: string, signature: string, secret: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const expected = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  const expectedB64 = btoa(String.fromCharCode(...new Uint8Array(expected)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return expectedB64 === signature;
}

export const onRequestPost = async ({ request, env }: { request: Request; env: Env }) => {
  try {
    const { token } = await request.json();
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Token required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const secret = env.VERIFICATION_SECRET || "nuvio-verification-secret-2026";

    // Split token into payload.signature
    const [payloadB64, signature] = token.split(".");
    if (!payloadB64 || !signature) {
      return new Response(
        JSON.stringify({ error: "Invalid token format" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Verify the HMAC signature
    const valid = await verifySignature(payloadB64, signature, secret);
    if (!valid) {
      return new Response(
        JSON.stringify({ error: "Invalid or tampered token" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Decode the payload
    const payloadJson = atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(payloadJson);

    // Check expiry
    if (Date.now() > payload.exp) {
      return new Response(
        JSON.stringify({ error: "This verification link has expired. Please sign up again." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Return success + the email (no tokenId — account is assigned client-side)
    return new Response(
      JSON.stringify({ success: true, email: payload.email, uid: payload.uid }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch {
    return new Response(
      JSON.stringify({ error: "Verification failed" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
