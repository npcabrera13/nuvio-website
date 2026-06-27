export const onRequestPost = async ({ request }: { request: Request }) => {
  try {
    const rawBody = await request.text();
    const payload = JSON.parse(rawBody);
    const eventType = payload?.data?.attributes?.type;
    if (eventType !== "checkout.session.paid") {
      return new Response(JSON.stringify({ success: true, message: "Ignored" }), { headers: { "Content-Type": "application/json" } });
    }
    const metadata = payload?.data?.attributes?.data?.attributes?.metadata || {};
    console.log("Payment received:", { plan: metadata.plan, days: metadata.days });
    return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
  } catch {
    return new Response(JSON.stringify({ error: "Webhook failed" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
};
