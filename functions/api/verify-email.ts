export const onRequestPost = async ({ request }: { request: Request }) => {
  try {
    const { token } = await request.json();
    if (!token) {
      return new Response(JSON.stringify({ error: "Token required" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }
    return new Response(JSON.stringify({ success: true, message: "Verification processed" }), { headers: { "Content-Type": "application/json" } });
  } catch {
    return new Response(JSON.stringify({ error: "Failed" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
};
