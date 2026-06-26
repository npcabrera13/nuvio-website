import { NextRequest, NextResponse } from "next/server";
export const runtime = "edge";

/**
 * POST /api/paymongo/create-session
 * Body: { plan: "30" | "60" | "90" }
 *
 * Creates a PayMongo checkout session for the selected plan.
 * Returns the checkout URL that the user is redirected to.
 *
 * PayMongo API docs: https://developers.paymongo.com/reference/create-a-checkout-session
 */

const PLANS: Record<string, { days: number; price: number; description: string }> = {
  "30": { days: 30, price: 4900, description: "Nuvio 30-day subscription" },       // ₱49.00 (in centavos)
  "60": { days: 60, price: 8900, description: "Nuvio 60-day subscription" },       // ₱89.00
  "90": { days: 90, price: 12900, description: "Nuvio 90-day subscription" },      // ₱129.00
};

export async function POST(req: NextRequest) {
  try {
    const { plan } = await req.json();

    if (!plan || !PLANS[plan]) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const selectedPlan = PLANS[plan];
    const secretKey = process.env.PAYMONGO_SECRET_KEY;

    if (!secretKey) {
      return NextResponse.json({ error: "PayMongo not configured" }, { status: 500 });
    }

    // Get the base URL for redirects
    const baseUrl = req.nextUrl.origin;

    // Create PayMongo checkout session
    // PayMongo uses Basic Auth with the secret key
    const response = await fetch("https://api.paymongo.com/v1/checkout_sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${Buffer.from(secretKey + ":").toString("base64")}`,
      },
      body: JSON.stringify({
        data: {
          attributes: {
            description: selectedPlan.description,
            amount: selectedPlan.price,          // in centavos (₱49 = 4900)
            currency: "PHP",
            // PayMongo doesn't have a direct "metadata" at session level,
            // but we can pass it via line_items or send_email
            line_items: [
              {
                name: selectedPlan.description,
                amount: selectedPlan.price,
                currency: "PHP",
                quantity: 1,
              },
            ],
            payment_method_types: [
              "gcash",
              "card",
              "atome",
              "dob",
              "dob_ubp",
            ],
            // After payment, redirect back to dashboard
            success_url: `${baseUrl}/dashboard?payment=success&plan=${plan}`,
            failed_url: `${baseUrl}/dashboard?payment=failed`,
            // We'll use the webhook to actually process the payment
            // The redirect URL is just for UX
            metadata: {
              plan: plan,
              days: String(selectedPlan.days),
            },
          },
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("PayMongo error:", data);
      return NextResponse.json(
        { error: data?.errors?.[0]?.detail || "Failed to create payment session" },
        { status: 500 }
      );
    }

    // Return the checkout URL
    const checkoutUrl = data.data.attributes.checkout_url;
    const sessionId = data.data.id;

    return NextResponse.json({
      success: true,
      checkoutUrl,
      sessionId,
    });
  } catch (err) {
    console.error("Create session error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
