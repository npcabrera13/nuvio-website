import { NextRequest, NextResponse } from "next/server";
export const runtime = "edge";

/**
 * POST /api/paymongo/webhook
 *
 * Edge-compatible: receives PayMongo webhook, returns success.
 * The actual token extension is handled client-side when the user
 * returns to the dashboard after payment (via the success redirect URL).
 *
 * For production with Firebase Admin SDK, this route would:
 * 1. Verify the payment
 * 2. Add days to the user's token in Firestore
 * But Admin SDK is Node.js-only, so on Cloudflare we handle it via redirect.
 */

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const payload = JSON.parse(rawBody);
    const eventType = payload?.data?.attributes?.type;

    if (eventType !== "checkout.session.paid") {
      return NextResponse.json({ success: true, message: "Ignored" });
    }

    // Log the payment (for debugging)
    const metadata = payload?.data?.attributes?.data?.attributes?.metadata || {};
    console.log("Payment received:", { plan: metadata.plan, days: metadata.days });

    // Return success — the dashboard will handle token extension via the redirect URL
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}
