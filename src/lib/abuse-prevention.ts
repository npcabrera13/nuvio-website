/**
 * Abuse prevention for signup.
 *
 * 1. EMAIL WHITELIST — only allow real email providers (Gmail, Outlook, Yahoo, etc).
 *    Blocks ALL disposable/tempmail domains by default (whitelist approach).
 *
 * 2. Multi-account detection — stores a flag in localStorage + cookies after the
 *    first signup. If they try to sign up again, block them.
 */

/** Allowed email domains (real providers only) */
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
  "edu.ph",
  "up.edu.ph",
  "dlsu.edu.ph",
  "ust.edu.ph",
  "ateneo.edu",
  "adnu.edu.ph",
];

/** localStorage key for tracking signups from this browser */
const SIGNUP_FLAG_KEY = "nuvio-signed-up";
const SIGNUP_EMAIL_KEY = "nuvio-signup-email";

function setCookie(name: string, value: string, days: number = 365): void {
  try {
    const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
  } catch {}
}

function getCookie(name: string): string | null {
  try {
    const match = document.cookie
      .split("; ")
      .find((c) => c.startsWith(`${name}=`));
    if (match) {
      return decodeURIComponent(match.split("=").slice(1).join("="));
    }
  } catch {}
  return null;
}

/**
 * Check if an email uses an ALLOWED domain.
 * Returns true if the email should be BLOCKED (not in whitelist).
 */
export function isTempmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase().trim();
  if (!domain) return true; // no domain = block
  return !ALLOWED_DOMAINS.includes(domain);
}

/**
 * Get the list of allowed domains (for display purposes).
 */
export function getAllowedDomains(): string[] {
  return ALLOWED_DOMAINS;
}

/**
 * Check if this browser has already been used to sign up.
 * Checks BOTH localStorage AND cookies.
 */
export function getPreviousSignupEmail(): string | null {
  try {
    const flag = localStorage.getItem(SIGNUP_FLAG_KEY);
    const email = localStorage.getItem(SIGNUP_EMAIL_KEY);
    if (flag === "true" && email) return email;
  } catch {}
  try {
    const emailCookie = getCookie("nuvio_email");
    const flagCookie = getCookie("nuvio_signup");
    if (flagCookie === "1" && emailCookie) return emailCookie;
  } catch {}
  return null;
}

/**
 * Record that a signup happened from this browser.
 * Stores in BOTH localStorage AND cookies for redundancy.
 */
export function recordSignup(email: string): void {
  try {
    localStorage.setItem(SIGNUP_FLAG_KEY, "true");
    localStorage.setItem(SIGNUP_EMAIL_KEY, email.toLowerCase());
  } catch {}
  try {
    setCookie("nuvio_signup", "1", 365);
    setCookie("nuvio_email", email.toLowerCase(), 365);
  } catch {}
}

/**
 * Check if this is a legit "second attempt" (same email as before).
 */
export function isSameEmailAsPrevious(email: string): boolean {
  try {
    const prev = localStorage.getItem(SIGNUP_EMAIL_KEY);
    return prev === email.toLowerCase();
  } catch {
    return false;
  }
}
