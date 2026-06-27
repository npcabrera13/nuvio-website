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
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Verify your Nuvio account</title>
  <style>
    body { font-family: Arial, Helvetica, sans-serif; line-height: 1.6; color: #1a1a1a; margin: 0; padding: 0; background: #f4f4f5; }
    .container { max-width: 560px; margin: 0 auto; background: #ffffff; }
    .header { background: linear-gradient(135deg, #7c3aed, #ec4899); color: #fff; padding: 28px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; letter-spacing: 0.5px; }
    .content { padding: 32px 28px; }
    .content p { margin: 0 0 16px; }
    .btn { display: inline-block; background: #7c3aed; color: #fff; font-weight: 700; padding: 14px 36px; border-radius: 10px; text-decoration: none; margin: 8px 0 20px; }
    .info-box { background: #f8f9fa; border-left: 4px solid #7c3aed; padding: 16px 20px; margin: 20px 0; }
    .info-box p { margin: 6px 0; font-size: 14px; }
    .footer { background: #f4f4f5; color: #6b7280; padding: 20px; text-align: center; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><h1>Nuvio</h1></div>
    <div class="content">
      <p>Hi there,</p>
      <p>Welcome to Nuvio! You are one step away from unlocking your <strong>7-day free trial</strong> of the Philippines' all-in-one streaming bundle — movies, series, anime, and live TV channels.</p>
      <p>Please confirm your email address to activate your account:</p>
      <a href="${verifyUrl}" class="btn">Verify My Email</a>
      <div class="info-box">
        <p><strong>What happens next?</strong></p>
        <p>Once verified, you will get instant access to a Nuvio.tv account with 7 days of free streaming. No credit card required.</p>
        <p><strong>Link expires in 24 hours.</strong> If you did not sign up for Nuvio, you can safely ignore this email.</p>
      </div>
      <p>Need help? Reply to this email and our team will assist you.</p>
      <p>Best regards,<br><strong>The Nuvio Team</strong></p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Nuvio. Made in the Philippines.</p>
    </div>
  </div>
</body>
</html>`;

    // Plain-text alternative — helps with spam filters (multipart emails)
    const emailText = `Nuvio — Verify your email

Hi there,

Welcome to Nuvio! You are one step away from unlocking your 7-day free trial of the Philippines' all-in-one streaming bundle — movies, series, anime, and live TV channels.

Please confirm your email address by clicking the link below:
${verifyUrl}

What happens next?
Once verified, you will get instant access to a Nuvio.tv account with 7 days of free streaming. No credit card required.

Link expires in 24 hours. If you did not sign up for Nuvio, you can safely ignore this email.

Need help? Reply to this email and our team will assist you.

Best regards,
The Nuvio Team

© ${new Date().getFullYear()} Nuvio. Made in the Philippines.`;

    // Send the email via the send-email Function (worker-mailer + Gmail SMTP)
    await fetch(`${baseUrl}/api/send-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: email,
        subject: "Verify your Nuvio account",  // no ✓ — unicode triggers spam filters
        html: emailHtml,
        text: emailText,  // plain-text alternative (multipart)
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
