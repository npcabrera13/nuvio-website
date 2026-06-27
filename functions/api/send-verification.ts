// Cloudflare Pages Function — generates a signed verification token (HMAC)
// NO Firestore reads or writes. The token is a JWT-like string that contains
// the tokenId + expiry, signed with VERIFICATION_SECRET env var.

interface Env {
  VERIFICATION_SECRET: string;
}

/** Sign a payload with HMAC-SHA256 using Web Crypto API (works in Workers) */
async function sign(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export const onRequestPost = async ({ request, env }: { request: Request; env: Env }) => {
  try {
    const { email, uid } = await request.json();
    if (!email || !uid) {
      return new Response(
        JSON.stringify({ error: "email and uid required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Default secret for dev; set VERIFICATION_SECRET in Cloudflare for prod
    const secret = env.VERIFICATION_SECRET || "nuvio-verification-secret-2026";

    // Build the signed token: base64(payload).signature
    // NOTE: No tokenId here — the Nuvio account is assigned AFTER verification,
    // not at signup. This prevents wasting accounts on unverified emails.
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    const payload = JSON.stringify({ uid, email, exp: expiresAt });
    const payloadB64 = btoa(payload)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    const signature = await sign(payloadB64, secret);
    const token = `${payloadB64}.${signature}`;

    const baseUrl = new URL(request.url).origin;
    const verifyUrl = `${baseUrl}/verify?token=${token}`;

    const emailHtml = `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#0a0a0f;padding:40px 24px;border-radius:16px;">
      <h1 style="color:#f5f5f7;text-align:center;"><span style="background:linear-gradient(100deg,#a78bfa,#ec4899);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">Nuvio</span></h1>
      <h2 style="color:#f5f5f7;">Welcome! 👋</h2>
      <p style="color:#9b9bab;">Verify your email to unlock your 7-day free trial.</p>
      <a href="${verifyUrl}" style="display:inline-block;background:linear-gradient(100deg,#7c3aed,#ec4899);color:#fff;font-weight:700;padding:16px 40px;border-radius:12px;text-decoration:none;">Verify My Email →</a>
      <p style="color:#6b6b7b;font-size:12px;">© ${new Date().getFullYear()} Nuvio. Made in the Philippines.</p>
    </div>`;

    // Send the email via the send-email Function (worker-mailer + Gmail SMTP)
    await fetch(`${baseUrl}/api/send-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: email,
        subject: "Verify your Nuvio account ✓",
        html: emailHtml,
      }),
    });

    return new Response(
      JSON.stringify({ success: true, expiresAt: new Date(expiresAt).toISOString() }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Failed to send verification email" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
