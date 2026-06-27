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
 * Returns the previous email if so, null otherwise.
 */
export function getPreviousSignupEmail(): string | null {
  try {
    const flag = localStorage.getItem(SIGNUP_FLAG_KEY);
    const email = localStorage.getItem(SIGNUP_EMAIL_KEY);
    if (flag === "true" && email) return email;
  } catch {
    // localStorage may be blocked (incognito, privacy settings)
  }
  return null;
}

/**
 * Record that a signup happened from this browser.
 * Called after a successful signup (Auth user created).
 */
export function recordSignup(email: string): void {
  try {
    localStorage.setItem(SIGNUP_FLAG_KEY, "true");
    localStorage.setItem(SIGNUP_EMAIL_KEY, email.toLowerCase());
  } catch {
    // localStorage may be blocked — can't track
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
