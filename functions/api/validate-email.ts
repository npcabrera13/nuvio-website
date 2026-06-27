// Cloudflare Pages Function — validates email BEFORE Firebase Auth user creation
//
// WHITELIST approach: only allow real email providers (Gmail, Outlook, Yahoo, etc).
// This blocks ALL disposable/tempmail domains by default — no need to maintain
// a 100k+ domain blocklist. Simpler and more secure.

const ALLOWED_DOMAINS = [
  "gmail.com",
  "googlemail.com",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "msn.com",
  "yahoo.com",
  "yahoo.com.ph",
  "yahoo.co.uk",
  "ymail.com",
  "rocketmail.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "protonmail.com",
  "proton.me",
  "tutanota.com",
  "zoho.com",
  "aol.com",
  "gmx.com",
  "gmx.net",
  "mail.com",
  // Philippine university emails
  "edu.ph",
  "up.edu.ph",
  "dlsu.edu.ph",
  "ust.edu.ph",
  "ateneo.edu",
  "adnu.edu.ph",
];

export const onRequestPost = async ({ request }: { request: Request }) => {
  try {
    const { email } = await request.json();
    if (!email || typeof email !== "string") {
      return new Response(
        JSON.stringify({ allowed: false, reason: "Email is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const domain = email.split("@")[1]?.toLowerCase().trim();
    if (!domain) {
      return new Response(
        JSON.stringify({ allowed: false, reason: "Invalid email format" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Whitelist check — only allow real email providers
    if (!ALLOWED_DOMAINS.includes(domain)) {
      return new Response(
        JSON.stringify({
          allowed: false,
          reason: "Please use a real email provider (Gmail, Outlook, Yahoo, iCloud, etc.). Disposable email addresses are not allowed.",
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // Email passed — allowed
    return new Response(
      JSON.stringify({ allowed: true }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Email validation error:", err);
    // On error, ALLOW the signup (don't block legit users if the check fails)
    return new Response(
      JSON.stringify({ allowed: true, warning: "Validation skipped due to error" }),
      { headers: { "Content-Type": "application/json" } }
    );
  }
};
