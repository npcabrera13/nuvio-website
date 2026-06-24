"use client";

import { useEffect, type RefObject } from "react";

/**
 * Adds keyboard arrow-key navigation to a horizontal scroller.
 * When the scroller (or any child) is focused, Left/Right arrows scroll it.
 *
 * Also exposes global ⌘K / Ctrl+K to open search via the callback.
 */
export function useScrollerKeyboard(
  ref: RefObject<HTMLElement | null>,
  options?: { onOpenSearch?: () => void }
) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleKey = (e: KeyboardEvent) => {
      // Global ⌘K / Ctrl+K opens search
      if (
        (e.metaKey || e.ctrlKey) &&
        (e.key === "k" || e.key === "K")
      ) {
        e.preventDefault();
        options?.onOpenSearch?.();
        return;
      }

      // Arrow keys only when the scroller or a descendant is focused
      const active = document.activeElement;
      if (!el.contains(active)) return;

      if (e.key === "ArrowRight") {
        e.preventDefault();
        el.scrollBy({ left: el.clientWidth * 0.8, behavior: "smooth" });
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        el.scrollBy({ left: -el.clientWidth * 0.8, behavior: "smooth" });
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [ref, options]);
}
