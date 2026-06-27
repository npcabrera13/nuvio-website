// Cloudflare Pages Function — validates email BEFORE Firebase Auth user creation
//
// Uses the well-maintained disposable-email-domains list (100k+ domains) from
// https://github.com/disposable-email-domains/disposable-email-domains
//
// The list is fetched once, cached in the Worker global scope for 24 hours,
// then reused across all requests. This keeps the check fast (no repeated
// fetches) and comprehensive (catches tempmail services like cadebek.com
// that a small hardcoded list would miss).

const LIST_URL = "https://raw.githubusercontent.com/disposable-email-domains/disposable-email-domains/main/disposable_email_blocklist.conf";
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Global cache (persists across Worker invocations until the isolate is recycled)
let _domainSet: Set<string> | null = null;
let _fetchPromise: Promise<Set<string>> | null = null;
let _fetchTime = 0;

async function getDisposableDomains(): Promise<Set<string>> {
  const now = Date.now();
  if (_domainSet && now - _fetchTime < CACHE_TTL) {
    return _domainSet;
  }
  // Deduplicate concurrent fetches
  if (_fetchPromise) return _fetchPromise;

  _fetchPromise = (async () => {
    try {
      const res = await fetch(LIST_URL, {
        // @ts-ignore — cf is a Cloudflare fetch extension
        cf: { cacheTtl: 86400, cacheEverything: true },
      });
      if (!res.ok) throw new Error(`Failed to fetch list: ${res.status}`);
      const text = await res.text();
      const domains = text
        .split("\n")
        .map((d) => d.trim().toLowerCase())
        .filter((d) => d.length > 0 && !d.startsWith("#"));
      _domainSet = new Set(domains);
      _fetchTime = now;
      console.log(`Loaded ${_domainSet.size} disposable domains`);
      return _domainSet;
    } catch (err) {
      console.error("Failed to load disposable domains list:", err);
      // Fallback: a small hardcoded list of the most common tempmail domains
      const fallback = new Set([
        "mailinator.com", "guerrillamail.com", "10minutemail.com",
        "tempmail.com", "throwawaymail.com", "yopmail.com",
        "getnada.com", "trashmail.com", "fakeinbox.com",
        "mailnesia.com", "dispostable.com", "sharklasers.com",
        "tempmail.net", "tempmail.org", "temp-mail.org",
      ]);
      _domainSet = fallback;
      _fetchTime = now;
      return _domainSet;
    } finally {
      _fetchPromise = null;
    }
  })();

  return _fetchPromise;
}

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

    // Common test/example domains — always block
    const testDomains = ["example.com", "example.org", "test.com", "test.org", "localhost"];
    if (testDomains.includes(domain)) {
      return new Response(
        JSON.stringify({ allowed: false, reason: "Test domains are not allowed" }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // Check against the 100k+ disposable domain list
    const disposableSet = await getDisposableDomains();
    if (disposableSet.has(domain)) {
      return new Response(
        JSON.stringify({
          allowed: false,
          reason: "Disposable email addresses are not allowed. Please use a real email (Gmail, Outlook, Yahoo, etc.)",
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // Also check subdomain patterns (e.g., sub.mailinator.com)
    const parts = domain.split(".");
    for (let i = 0; i < parts.length - 1; i++) {
      const subdomain = parts.slice(i).join(".");
      if (disposableSet.has(subdomain)) {
        return new Response(
          JSON.stringify({
            allowed: false,
            reason: "Disposable email addresses are not allowed. Please use a real email (Gmail, Outlook, Yahoo, etc.)",
          }),
          { headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // Email passed all checks
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
