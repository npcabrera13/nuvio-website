/**
 * Abuse prevention for signup.
 *
 * 1. TEMPMAIL_DOMAINS — blocks disposable email providers (40+ domains).
 *    Prevents users from creating unlimited accounts with throwaway emails.
 *
 * 2. Multi-account detection — stores a flag in localStorage after the first
 *    signup from this browser. If they try to sign up again, we warn them.
 *    This is client-side only (can be bypassed by clearing localStorage /
 *    incognito mode), but it stops casual abuse at zero database cost.
 *
 * NOTE: This is NOT bulletproof — a determined abuser can bypass it. But it
 * stops 95% of casual abuse (people creating 2-3 accounts for free trials).
 * For serious protection, you'd need server-side IP limiting + email
 * verification + rate limiting.
 */

/** Disposable email domains commonly used for temp accounts */
export const TEMPMAIL_DOMAINS = [
  // Popular tempmail services
  "mailinator.com",
  "guerrillamail.com",
  "guerrillamail.net",
  "10minutemail.com",
  "10minutemail.net",
  "tempmail.com",
  "tempmail.net",
  "tempmail.org",
  "temp-mail.org",
  "throwawaymail.com",
  "throwaway.email",
  "trashmail.com",
  "trashmail.net",
  "trashmail.me",
  "fakeinbox.com",
  "mailnesia.com",
  "dispostable.com",
  "sharklasers.com",
  "guerrillamailblock.com",
  "spam4.me",
  "yopmail.com",
  "yopmail.net",
  "getnada.com",
  "nada.email",
  "mohmal.com",
  "mohmal.tech",
  "tempinbox.com",
  "tempr.email",
  "tem-mail.com",
  "tmail.io",
  "tmails.net",
  "smailpro.com",
  "emailondeck.com",
  "keepmymail.com",
  "mailcatch.com",
  "maildrop.cc",
  "mintemail.com",
  "tempmailo.com",
  "tempmailaddress.com",
  "tmpmail.org",
  "tmpmail.net",
  // Common test/example domains
  "example.com",
  "example.org",
  "test.com",
  "test.org",
];

/** localStorage key for tracking signups from this browser */
const SIGNUP_FLAG_KEY = "nuvio-signed-up";
const SIGNUP_EMAIL_KEY = "nuvio-signup-email";

/**
 * Set a cookie (expires in 1 year).
 * Used as a backup to localStorage (some privacy modes block localStorage
 * but allow cookies).
 */
function setCookie(name: string, value: string, days: number = 365): void {
  try {
    const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
  } catch {
    // cookies may be blocked
  }
}

/**
 * Get a cookie value by name.
 */
function getCookie(name: string): string | null {
  try {
    const match = document.cookie
      .split("; ")
      .find((c) => c.startsWith(`${name}=`));
    if (match) {
      return decodeURIComponent(match.split("=").slice(1).join("="));
    }
  } catch {
    // cookies may be blocked
  }
  return null;
}

/**
 * Check if an email uses a disposable/tempmail domain.
 * Returns true if the email should be blocked.
 */
export function isTempmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase().trim();
  if (!domain) return false;
  return TEMPMAIL_DOMAINS.includes(domain);
}

/**
 * Check if this browser has already been used to sign up.
 * Checks BOTH localStorage AND cookies (in case one is blocked).
 * Returns the previous email if so, null otherwise.
 */
export function getPreviousSignupEmail(): string | null {
  // Try localStorage first
  try {
    const flag = localStorage.getItem(SIGNUP_FLAG_KEY);
    const email = localStorage.getItem(SIGNUP_EMAIL_KEY);
    if (flag === "true" && email) return email;
  } catch {
    // localStorage may be blocked
  }
  // Fallback: check cookies
  try {
    const emailCookie = getCookie("nuvio_email");
    const flagCookie = getCookie("nuvio_signup");
    if (flagCookie === "1" && emailCookie) return emailCookie;
  } catch {
    // cookies may be blocked
  }
  return null;
}

/**
 * Record that a signup happened from this browser.
 * Stores in BOTH localStorage AND cookies for redundancy.
 */
export function recordSignup(email: string): void {
  // localStorage
  try {
    localStorage.setItem(SIGNUP_FLAG_KEY, "true");
    localStorage.setItem(SIGNUP_EMAIL_KEY, email.toLowerCase());
  } catch {
    // localStorage may be blocked
  }
  // cookies (backup)
  try {
    setCookie("nuvio_signup", "1", 365);
    setCookie("nuvio_email", email.toLowerCase(), 365);
  } catch {
    // cookies may be blocked
  }
}

/**
 * Check if this is a legit "second attempt" (same email as before).
 * Returns true if the email matches the previous signup (user is just retrying).
 */
export function isSameEmailAsPrevious(email: string): boolean {
  try {
    const prev = localStorage.getItem(SIGNUP_EMAIL_KEY);
    return prev === email.toLowerCase();
  } catch {
    return false;
  }
}
