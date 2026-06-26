const PLANS: Record<string, { days: number; price: number; description: string }> = {
  "30": { days: 30, price: 4900, description: "Nuvio 30-day subscription" },
  "60": { days: 60, price: 8900, description: "Nuvio 60-day subscription" },
  "90": { days: 90, price: 12900, description: "Nuvio 90-day subscription" },
};

export const onRequestPost = async ({ request }: { request: Request }) => {
  try {
    const { plan } = await request.json();
    if (!plan || !PLANS[plan]) {
      return new Response(JSON.stringify({ error: "Invalid plan" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }

    const selectedPlan = PLANS[plan];
    const secretKey = process.env.PAYMONGO_SECRET_KEY;
    if (!secretKey) {
      return new Response(JSON.stringify({ error: "PayMongo not configured" }), { status: 500, headers: { "Content-Type": "application/json" } });
    }

    const baseUrl = new URL(request.url).origin;
    const response = await fetch("https://api.paymongo.com/v1/checkout_sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${btoa(secretKey + ":")}`,
      },
      body: JSON.stringify({
        data: {
          attributes: {
            description: selectedPlan.description,
            amount: selectedPlan.price,
            currency: "PHP",
            line_items: [{ name: selectedPlan.description, amount: selectedPlan.price, currency: "PHP", quantity: 1 }],
            payment_method_types: ["gcash", "card", "atome", "dob", "dob_ubp"],
            success_url: `${baseUrl}/dashboard?payment=success&plan=${plan}`,
            failed_url: `${baseUrl}/dashboard?payment=failed`,
            metadata: { plan, days: String(selectedPlan.days) },
          },
        },
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return new Response(JSON.stringify({ error: data?.errors?.[0]?.detail || "Failed" }), { status: 500, headers: { "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ success: true, checkoutUrl: data.data.attributes.checkout_url, sessionId: data.data.id }), { headers: { "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Something went wrong" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
};
