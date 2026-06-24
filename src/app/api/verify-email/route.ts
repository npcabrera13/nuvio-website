import { NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps, cert, getApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

/**
 * Initialize Firebase Admin SDK lazily.
 * Requires FIREBASE_ADMIN_* env vars for service account credentials.
 * In dev without service account, we fall back to client-side verification
 * by having the client read the verification doc directly.
 */

let adminApp: ReturnType<typeof initializeApp> | null = null;

function getAdmin() {
  if (adminApp) return adminApp;
  if (getApps().length) {
    adminApp = getApp();
  } else {
    // Service account from env vars
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error("Missing Firebase Admin credentials");
    }

    adminApp = initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
    });
  }
  return adminApp;
}

/**
 * POST /api/verify-email
 * Body: { token }
 *
 * Looks up the verification token in Firestore `verifications/{token}`,
 * validates it hasn't expired or been used, then marks the user's
 * `customers/{uid}` doc as emailVerified: true.
 *
 * This route uses the Firebase Admin SDK which bypasses security rules,
 * so it can write to the customer doc (which users can't write to).
 */
export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json(
        { error: "Verification token is required." },
        { status: 400 }
      );
    }

    // Try Admin SDK first; if not configured, return a helpful error
    let adminDb;
    try {
      adminDb = getFirestore(getAdmin());
    } catch {
      return NextResponse.json(
        {
          error:
            "Server not configured for verification. Set FIREBASE_ADMIN_* env vars.",
        },
        { status: 500 }
      );
    }

    // 1. Look up the verification token
    const verRef = adminDb.collection("verifications").doc(token);
    const verSnap = await verRef.get();

    if (!verSnap.exists) {
      return NextResponse.json(
        { error: "Invalid or expired verification link." },
        { status: 400 }
      );
    }

    const verData = verSnap.data()!;

    // 2. Check if already used
    if (verData.used) {
      return NextResponse.json(
        { error: "This verification link has already been used." },
        { status: 400 }
      );
    }

    // 3. Check expiry
    const expiresAt = verData.expiresAt?.toDate?.() ?? new Date(verData.expiresAt);
    if (expiresAt < new Date()) {
      return NextResponse.json(
        { error: "This verification link has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // 4. Mark the user's customer doc as verified (Admin SDK bypasses rules)
    const uid = verData.uid;
    await adminDb.collection("customers").doc(uid).update({
      emailVerified: true,
    });

    // 5. Mark the verification token as used
    await verRef.update({ used: true, verifiedAt: new Date() });

    return NextResponse.json({
      success: true,
      message: "Email verified successfully!",
      uid,
    });
  } catch (err) {
    console.error("Verify email error:", err);
    return NextResponse.json(
      { error: "Verification failed. Please try again." },
      { status: 500 }
    );
  }
}
