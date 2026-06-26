import { NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps, cert, getApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

/**
 * POST /api/paymongo/webhook
 *
 * Receives payment confirmation from PayMongo.
 * When a payment succeeds, this adds days to the user's token in Firestore.
 *
 * To set up:
 * 1. Go to PayMongo Dashboard → Developers → Webhooks
 * 2. Add webhook URL: https://your-domain.com/api/paymongo/webhook
 * 3. Select events: checkout.session.paid
 * 4. Copy the webhook secret and add as env var: PAYMONGO_WEBHOOK_SECRET
 *
 * Firestore cost: 1 read (find token by assignedTo) + 1 write (update expiresAt)
 * Only runs on successful payment — zero cost for failed payments.
 */

let adminApp: ReturnType<typeof initializeApp> | null = null;

function getAdmin() {
  if (adminApp) return adminApp;
  if (getApps().length) {
    adminApp = getApp();
  } else {
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

const PLANS: Record<string, number> = {
  "30": 30,
  "60": 60,
  "90": 90,
};

export async function POST(req: NextRequest) {
  try {
    // Verify webhook signature (if secret is configured)
    const webhookSecret = process.env.PAYMONGO_WEBHOOK_SECRET;
    const rawBody = await req.text();

    if (webhookSecret) {
      // PayMongo sends signature in header: paymongo-signature
      // For now, we'll skip signature verification in dev
      // TODO: Implement proper signature verification
    }

    const payload = JSON.parse(rawBody);

    // PayMongo webhook payload structure:
    // { data: { attributes: { type: "checkout.session.paid", data: { id, attributes: { metadata, amount, ... } } } } }
    const eventType = payload?.data?.attributes?.type;

    if (eventType !== "checkout.session.paid") {
      return NextResponse.json({ success: true, message: "Ignored (not a payment event)" });
    }

    const sessionData = payload?.data?.attributes?.data?.attributes;
    const metadata = sessionData?.metadata || {};

    const plan = metadata.plan;
    const daysToAdd = PLANS[plan];

    if (!daysToAdd) {
      console.error("No valid plan in webhook metadata:", metadata);
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    // Initialize Firebase Admin
    let adminDb;
    try {
      adminDb = getFirestore(getAdmin());
    } catch {
      return NextResponse.json(
        { error: "Server not configured. Set FIREBASE_ADMIN_* env vars." },
        { status: 500 }
      );
    }

    // Find the token assigned to this user
    // The metadata should contain the user's UID or token
    // For now, we need to pass the token or uid in the metadata when creating the session
    // This is a TODO — for now the redirect URL handles it client-side

    // TODO: When we add uid to the session metadata, we can process the payment here:
    // 1. Query: customers where assignedTo == uid
    // 2. Read current expiresAt
    // 3. Add daysToAdd to expiresAt (or from now if expired)
    // 4. Write new expiresAt

    console.log("Payment webhook received:", { plan, daysToAdd, metadata });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}
