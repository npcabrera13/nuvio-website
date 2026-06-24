"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

/**
 * Top scroll-progress bar (gradient) + floating back-to-top button.
 * Both are purely presentational and add zero backend surface.
 */
export function ScrollUtilities() {
  const [progress, setProgress] = useState(0);
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY;
      const height =
        document.documentElement.scrollHeight - window.innerHeight;
      const pct = height > 0 ? Math.min(100, (scrollTop / height) * 100) : 0;
      setProgress(pct);
      // Show back-to-top after passing ~1.2 viewports
      setShowTop(scrollTop > window.innerHeight * 1.2);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <>
      {/* Scroll progress bar — fixed at very top, above navbar */}
      <div
        className="fixed top-0 left-0 right-0 z-[60] h-1 pointer-events-none"
        aria-hidden="true"
      >
        <div
          className="h-full nuvio-gradient-bg transition-[width] duration-150 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Back-to-top button */}
      <button
        type="button"
        aria-label="Back to top"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className={`fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full nuvio-gradient-bg text-white shadow-xl shadow-violet-900/40 transition-all duration-300 ${
          showTop
            ? "opacity-100 translate-y-0 scale-100"
            : "opacity-0 translate-y-4 scale-90 pointer-events-none"
        }`}
      >
        <ArrowUp className="h-5 w-5" />
      </button>
    </>
  );
}
