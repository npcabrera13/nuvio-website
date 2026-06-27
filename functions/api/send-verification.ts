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

    // Build the base URL from the Host header — always correct, no env var needed.
    // - Local dev: Host = "localhost:3000" → http://localhost:3000
    // - Production: Host = "nuviotv.pages.dev" → https://nuviotv.pages.dev
    const host = request.headers.get("host") || new URL(request.url).host;
    const protocol = host.includes("localhost") ? "http" : "https";
    const baseUrl = `${protocol}://${host}`;
    const verifyUrl = `${baseUrl}/verify?token=${token}`;

    const emailHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Welcome to Nuvio</title>
</head>
<body style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#333;margin:0;padding:20px;background:#fff;">
  <p style="font-size:18px;font-weight:bold;color:#7c3aed;margin:0 0 16px;">Nuvio</p>
  <p>Hi,</p>
  <p>Thank you for signing up for Nuvio. Please verify your email address to activate your 7-day free trial:</p>
  <p><a href="${verifyUrl}" style="color:#7c3aed;font-weight:bold;">${verifyUrl}</a></p>
  <p>This link will expire in 24 hours. If you did not create an account, you can safely ignore this email.</p>
  <p>Best regards,<br>Nuvio Team</p>
  <p style="font-size:11px;color:#999;margin-top:24px;border-top:1px solid #eee;padding-top:12px;">© ${new Date().getFullYear()} Nuvio. Made in the Philippines.</p>
</body>
</html>`;

    const emailText = `Nuvio — Verify your email

Hi,

Thank you for signing up for Nuvio. Please verify your email address to activate your 7-day free trial:

${verifyUrl}

This link will expire in 24 hours. If you did not create an account, you can safely ignore this email.

Best regards,
Nuvio Team

© ${new Date().getFullYear()} Nuvio. Made in the Philippines.`;

    // Send the email via the send-email Function (worker-mailer + Gmail SMTP)
    await fetch(`${baseUrl}/api/send-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: email,
        subject: "Welcome to Nuvio — verify your email",
        html: emailHtml,
        text: emailText,
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
