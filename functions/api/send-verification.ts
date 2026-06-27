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
  <title>Nuvio</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#7c3aed,#ec4899);padding:28px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:0.5px;">Nuvio</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:36px 40px 20px;">
              <h2 style="margin:0 0 16px;color:#1a1a1a;font-size:18px;font-weight:600;">Hi there,</h2>
              <p style="margin:0 0 16px;color:#4a4a4a;font-size:15px;line-height:1.6;">
                Thanks for signing up for Nuvio — your all-in-one streaming bundle with movies, series, anime, and live channels.
              </p>
              <p style="margin:0 0 24px;color:#4a4a4a;font-size:15px;line-height:1.6;">
                Click the button below to confirm your email and activate your account:
              </p>
              <!-- Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-bottom:24px;">
                    <a href="${verifyUrl}" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#ec4899);color:#ffffff;font-weight:600;font-size:15px;padding:14px 40px;border-radius:10px;text-decoration:none;">Confirm Email</a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 12px;color:#6b7280;font-size:13px;line-height:1.5;">
                Or copy this link: <a href="${verifyUrl}" style="color:#7c3aed;word-break:break-all;">${verifyUrl}</a>
              </p>
              <p style="margin:0 0 8px;color:#6b7280;font-size:13px;line-height:1.5;">
                This link expires in 24 hours.
              </p>
            </td>
          </tr>
          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:0;">
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px 32px;">
              <p style="margin:0 0 8px;color:#6b7280;font-size:12px;line-height:1.5;">
                Nuvio is an independent streaming aggregator. This email was sent because someone signed up with your email address.
              </p>
              <p style="margin:0;color:#9ca3af;font-size:11px;">
                &copy; ${new Date().getFullYear()} Nuvio. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const emailText = `Nuvio

Hi there,

Thanks for signing up for Nuvio — your all-in-one streaming bundle with movies, series, anime, and live channels.

Click the link below to confirm your email and activate your account:

${verifyUrl}

This link expires in 24 hours.

Nuvio is an independent streaming aggregator. This email was sent because someone signed up with your email address.

© ${new Date().getFullYear()} Nuvio. All rights reserved.`;

    // Send the email via the send-email Function (worker-mailer + Gmail SMTP)
    await fetch(`${baseUrl}/api/send-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: email,
        subject: "Welcome to Nuvio",
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
