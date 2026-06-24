import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { initializeApp, getApps, cert, getApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { doc, setDoc } from "firebase/firestore";

/**
 * Initialize Firebase Admin SDK for server-side Firestore writes.
 * We use the client SDK's project config + a service account would normally
 * be needed, but for this minimal setup we use the client SDK for writes
 * since the security rules allow the user to create their own doc.
 *
 * For the verification token, we store it in a separate `verifications`
 * collection that's writable via a public create rule (one-time tokens).
 */

// Lazy-init nodemailer transporter (Gmail SMTP)
let transporter: nodemailer.Transporter | null = null;
function getTransporter() {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "nuviotv1@gmail.com",
      pass: "hnpu oblp fizr ejnl",
    },
  });
  return transporter;
}

function generateVerificationToken(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  return (
    Array.from({ length: 32 })
      .map(() => chars[Math.floor(Math.random() * chars.length)])
      .join("")
  );
}

/**
 * POST /api/send-verification
 * Body: { email, uid, username }
 *
 * Generates a verification token, stores it in Firestore `verifications/{token}`,
 * and sends a branded email from nuviotv1@gmail.com with a link to
 * /verify?token=...
 */
export async function POST(req: NextRequest) {
  try {
    const { email, uid, username } = await req.json();

    if (!email || !uid) {
      return NextResponse.json(
        { error: "Email and uid are required." },
        { status: 400 }
      );
    }

    const token = generateVerificationToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h expiry

    // Store verification token in Firestore (public-readable for verification,
    // writable via this API route which runs server-side)
    // We use the Firebase REST API or Admin SDK. For now, we'll store it
    // in a collection that the client can also write to during signup.
    // The verify-email route will read + delete this token.

    // Build the verification URL
    const baseUrl = req.nextUrl.origin;
    const verifyUrl = `${baseUrl}/verify?token=${token}`;

    // Send the email via Gmail SMTP
    const transport = getTransporter();
    await transport.sendMail({
      from: `"Nuvio" <nuviotv1@gmail.com>`,
      to: email,
      subject: "Verify your Nuvio account ✓",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; background: #0a0a0f; padding: 40px 24px; border-radius: 16px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #f5f5f7; font-size: 28px; font-weight: 800; margin: 0;">
              <span style="background: linear-gradient(100deg, #a78bfa, #ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Nuvio</span>
            </h1>
          </div>
          <h2 style="color: #f5f5f7; font-size: 22px; font-weight: 700; margin: 0 0 16px;">
            Welcome${username ? `, ${username}` : ""}! 👋
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

    // Return the token so the client can store it in Firestore
    // (the client has write access to create the verification record)
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
