import { NextRequest, NextResponse } from "next/server";
export const runtime = "edge";

/**
 * POST /api/verify-email
 * Body: { token }
 *
 * Edge-compatible: simply returns success.
 * The client (/verify page) handles the actual verification by calling
 * user.reload() to check Firebase Auth's emailVerified flag.
 *
 * For production with Firebase Admin SDK, this route would:
 * 1. Look up the token in Firestore
 * 2. Mark the user's emailVerified flag via Admin SDK
 * But Admin SDK is Node.js-only, so on Cloudflare we use the client-side approach.
 */

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ error: "Verification token is required." }, { status: 400 });
    }

    // Return success — the /verify page will reload the Firebase Auth user
    // and check emailVerified (which works if Firebase built-in was used)
    return NextResponse.json({
      success: true,
      message: "Verification processed. Please reload.",
    });
  } catch {
    return NextResponse.json({ error: "Verification failed." }, { status: 500 });
  }
}
