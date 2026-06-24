"use client";

import { useEffect, useState } from "react";
import { Play, X } from "lucide-react";

/**
 * Sticky bottom CTA bar shown only on mobile, only after the hero is scrolled past.
 * Keeps the primary conversion action always one tap away.
 */
export function MobileStickyCta() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      // show after hero (~ window height) is scrolled past, hide near final CTA
      const y = window.scrollY;
      const vh = window.innerHeight;
      const docH = document.documentElement.scrollHeight;
      const nearEnd = y + vh > docH - 700;
      setShow(y > vh * 0.9 && !nearEnd);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={`sm:hidden fixed inset-x-0 bottom-0 z-40 transition-transform duration-300 ${
        show ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="nuvio-glass border-t border-white/10 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">7 days free · no card</p>
            <p className="text-sm font-bold leading-tight">
              From <span className="nuvio-gradient-text">₱49/month</span>
            </p>
          </div>
          <a
            href="#trial"
            className="nuvio-gradient-bg inline-flex items-center gap-1.5 rounded-xl px-5 py-3 text-sm font-semibold text-white active:scale-95 transition-transform"
          >
            <Play className="h-4 w-4 fill-current" />
            Start Free
          </a>
        </div>
      </div>
    </div>
  );
}
