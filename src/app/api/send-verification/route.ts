import { NextRequest, NextResponse } from "next/server";
import { WorkerMailer } from "worker-mailer";

export const runtime = "edge";

/**
 * POST /api/send-verification
 * Body: { email, uid }
 *
 * Sends a branded verification email via Gmail SMTP using worker-mailer.
 * worker-mailer uses Cloudflare's native TCP sockets (cloudflare:sockets)
 * to connect to smtp.gmail.com — fully edge-compatible, no nodemailer needed.
 *
 * Env vars needed on Cloudflare:
 * - SMTP_EMAIL: nuviotv1@gmail.com
 * - SMTP_PASSWORD: hnpu oblp fizr ejnl (Gmail App Password)
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

    // Get SMTP credentials from env
    const smtpEmail = process.env.SMTP_EMAIL || "nuviotv1@gmail.com";
    const smtpPassword = process.env.SMTP_PASSWORD || "hnpu oblp fizr ejnl";

    // Connect to Gmail SMTP via worker-mailer (uses Cloudflare TCP sockets)
    const mailer = await WorkerMailer.connect({
      credentials: {
        username: smtpEmail,
        password: smtpPassword,
      },
      authType: "plain",
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
    });

    // Send the branded email
    await mailer.send({
      from: { name: "Nuvio", email: smtpEmail },
      to: { email },
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
            <a href="${verifyUrl}" style="display: inline-block; background: linear-gradient(100deg, #7c3aed, #ec4899); color: #ffffff; font-weight: 700; font-size: 16px; padding: 16px 40px; border-radius: 12px; text-decoration: none; box-shadow: 0 8px 32px -8px rgba(124, 58, 237, 0.5);">
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
      `,
    });

    return NextResponse.json({
      success: true,
      token,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (err) {
    console.error("Send verification error:", err);
    return NextResponse.json(
      { error: "Failed to send verification email. Please try again." },
      { status: 500 }
    );
  }
}
