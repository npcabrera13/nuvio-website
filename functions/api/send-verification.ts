export const onRequestPost = async ({ request }: { request: Request }) => {
  try {
    const { email, uid } = await request.json();
    if (!email || !uid) {
      return new Response(JSON.stringify({ error: "Email and uid required" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }

    const token = Array.from({ length: 32 })
      .map(() => "abcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(Math.random() * 36)])
      .join("");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const baseUrl = new URL(request.url).origin;
    const verifyUrl = `${baseUrl}/verify?token=${token}`;

    const emailHtml = `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#0a0a0f;padding:40px 24px;border-radius:16px;">
      <h1 style="color:#f5f5f7;text-align:center;"><span style="background:linear-gradient(100deg,#a78bfa,#ec4899);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">Nuvio</span></h1>
      <h2 style="color:#f5f5f7;">Welcome! 👋</h2>
      <p style="color:#9b9bab;">Verify your email to unlock your 7-day free trial.</p>
      <a href="${verifyUrl}" style="display:inline-block;background:linear-gradient(100deg,#7c3aed,#ec4899);color:#fff;font-weight:700;padding:16px 40px;border-radius:12px;text-decoration:none;">Verify My Email →</a>
      <p style="color:#6b6b7b;font-size:12px;">© ${new Date().getFullYear()} Nuvio. Made in the Philippines.</p>
    </div>`;

    // Call send-email function
    const res = await fetch(`${baseUrl}/api/send-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: email, subject: "Verify your Nuvio account ✓", html: emailHtml }),
    });

    const emailSent = res.ok;
    return new Response(JSON.stringify({ success: true, token, expiresAt: expiresAt.toISOString(), emailSent }), { headers: { "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Failed" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
};
