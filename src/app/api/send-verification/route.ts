import { NextRequest, NextResponse } from "next/server";
export const runtime = "edge";

/**
 * POST /api/send-verification
 * Body: { email, uid }
 *
 * Sends a branded verification email via Gmail SMTP.
 * Edge-compatible: uses fetch to an external SMTP API instead of nodemailer.
 *
 * We use Resend (or any edge-compatible email API) if configured.
 * If not configured, falls back to Firebase built-in sendEmailVerification.
 */

export async function POST(req: NextRequest) {
  try {
    const { email, uid } = await req.json();

    if (!email || !uid) {
      return NextResponse.json({ error: "Email and uid are required." }, { status: 400 });
    }

    // Generate a verification token
    const token = Array.from({ length: 32 })
      .map(() => "abcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(Math.random() * 36)])
      .join("");

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h expiry
    const baseUrl = req.nextUrl.origin;
    const verifyUrl = `${baseUrl}/verify?token=${token}`;

    // Try sending via Resend (edge-compatible) if API key is set
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Nuvio <nuvio@resend.dev>",
          to: [email],
          subject: "Verify your Nuvio account ✓",
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; background: #0a0a0f; padding: 40px 24px; border-radius: 16px;">
              <div style="text-align: center; margin-bottom: 32px;">
                <h1 style="color: #f5f5f7; font-size: 28px; font-weight: 800; margin: 0;">
                  <span style="background: linear-gradient(100deg, #a78bfa, #ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Nuvio</span>
                </h1>
              </div>
              <h2 style="color: #f5f5f7; font-size: 22px; font-weight: 700; margin: 0 0 16px;">
                Welcome! 👋
              </h2>
              <p style="color: #9b9bab; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
                You're almost ready to start streaming. Just verify your email address to unlock your 7-day free trial.
              </p>
              <div style="text-align: center; margin: 32px 0;">
                <a href="${verifyUrl}" style="display: inline-block; background: linear-gradient(100deg, #7c3aed, #ec4899); color: #ffffff; font-weight: 700; font-size: 16px; padding: 16px 40px; border-radius: 12px; text-decoration: none;">
                  Verify My Email →
                </a>
              </div>
              <p style="color: #6b6b7b; font-size: 13px; line-height: 1.5; margin: 24px 0 0;">
                This link expires in 24 hours. If you didn't create a Nuvio account, you can safely ignore this email.
              </p>
            </div>
          `,
        }),
      });

      if (!res.ok) {
        console.error("Resend email failed:", await res.text());
        return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
      }

      return NextResponse.json({ success: true, token, expiresAt: expiresAt.toISOString() });
    }

    // Fallback: return the verify URL so the client can use Firebase's built-in
    return NextResponse.json({
      success: true,
      token,
      expiresAt: expiresAt.toISOString(),
      fallback: true,
      message: "Email service not configured. Using Firebase built-in verification.",
    });
  } catch (err) {
    console.error("Send verification error:", err);
    return NextResponse.json({ error: "Failed to send verification email." }, { status: 500 });
  }
}
