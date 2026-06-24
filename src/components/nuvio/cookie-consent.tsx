"use client";

import { useEffect, useState } from "react";
import { Cookie, X } from "lucide-react";

const STORAGE_KEY = "nuvio-cookie-consent-v1";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        // small delay so it doesn't fight the hero animation
        const t = setTimeout(() => setVisible(true), 1200);
        return () => clearTimeout(t);
      }
    } catch {
      // localStorage may be blocked; skip banner
    }
  }, []);

  const decide = (choice: "accepted" | "rejected") => {
    try {
      localStorage.setItem(STORAGE_KEY, choice);
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      aria-live="polite"
      className="fixed inset-x-3 bottom-3 sm:inset-x-auto sm:left-6 sm:bottom-6 sm:max-w-md z-[70] nuvio-glass rounded-2xl border border-white/10 p-4 sm:p-5 shadow-2xl nuvio-rise"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl nuvio-gradient-bg text-white">
          <Cookie className="h-5 w-5" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">We use cookies</p>
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
            Nuvio uses cookies to improve your experience and analyze traffic. By
            continuing, you agree to our use of cookies in line with the
            Philippine Data Privacy Act of 2012.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => decide("accepted")}
              className="nuvio-gradient-bg inline-flex items-center justify-center rounded-lg px-4 py-2 text-xs font-semibold text-white active:scale-95 transition-transform"
            >
              Accept all
            </button>
            <button
              type="button"
              onClick={() => decide("rejected")}
              className="inline-flex items-center justify-center rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-foreground hover:bg-white/10 active:scale-95 transition"
            >
              Essential only
            </button>
          </div>
        </div>
        <button
          type="button"
          aria-label="Dismiss"
          onClick={() => decide("rejected")}
          className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
