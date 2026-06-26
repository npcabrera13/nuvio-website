import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

/**
 * POST /api/send-verification
 * Body: { email, uid }
 *
 * Edge-compatible: calls the Cloudflare Pages Function at /api/send-email
 * which uses worker-mailer (native Cloudflare TCP sockets) for Gmail SMTP.
 *
 * The Pages Function lives in functions/api/send-email.ts and bypasses
 * the Next.js build process entirely — worker-mailer works there because
 * there's no webpack/turbopack to interfere with cloudflare:sockets.
 */

export async function POST(req: NextRequest) {
  try {
    const { email, uid } = await req.json();

    if (!email || !uid) {
      return NextResponse.json({ error: "Email and uid are required." }, { status: 400 });
    }

    const token = Array.from({ length: 32 })
      .map(() => "abcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(Math.random() * 36)])
      .join("");

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const baseUrl = req.nextUrl.origin;
    const verifyUrl = `${baseUrl}/verify?token=${token}`;

    const emailHtml = `
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
        <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 32px 0;" />
        <p style="color: #6b6b7b; font-size: 12px; text-align: center; margin: 0;">
          © ${new Date().getFullYear()} Nuvio. Made in the Philippines.
        </p>
      </div>
    `;

    // Call the Cloudflare Pages Function (functions/api/send-email.ts)
    // This bypasses Next.js build — worker-mailer runs natively on Cloudflare
    let emailSent = false;
    try {
      const res = await fetch(`${baseUrl}/api/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: email, subject: "Verify your Nuvio account ✓", html: emailHtml }),
      });
      const data = await res.json();
      emailSent = data.success === true;
    } catch (fetchErr) {
      console.error("Failed to call send-email function:", fetchErr);
    }

    return NextResponse.json({
      success: true,
      token,
      expiresAt: expiresAt.toISOString(),
      emailSent,
    });
  } catch (err) {
    console.error("Send verification error:", err);
    return NextResponse.json(
      { error: "Failed to send verification email." },
      { status: 500 }
    );
  }
}
