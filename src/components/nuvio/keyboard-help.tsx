"use client";

import { useEffect, useState } from "react";
import { Keyboard, X, Search, ArrowLeft, ArrowRight, ArrowUp } from "lucide-react";

const SHORTCUTS = [
  {
    group: "Search",
    items: [
      { keys: ["⌘", "K"], label: "Open search", icon: Search },
      { keys: ["Esc"], label: "Close search / modal", icon: X },
    ],
  },
  {
    group: "Navigation",
    items: [
      { keys: ["←"], label: "Scroll movie row left", icon: ArrowLeft },
      { keys: ["→"], label: "Scroll movie row right", icon: ArrowRight },
      { keys: ["?"], label: "Show this help", icon: Keyboard },
      { keys: ["Esc"], label: "Close this help", icon: X },
    ],
  },
  {
    group: "Page",
    items: [
      { keys: ["Home"], label: "Back to top", icon: ArrowUp },
    ],
  },
];

export function KeyboardHelp() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // ? opens help (but not when typing in an input)
      const target = e.target as HTMLElement;
      const typing =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;

      if (e.key === "?" && !typing) {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
      <div className="relative w-full max-w-lg nuvio-card rounded-2xl overflow-hidden shadow-2xl shadow-black/50 nuvio-rise">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg nuvio-gradient-bg text-white">
              <Keyboard className="h-5 w-5" />
            </span>
            <h2 className="text-lg font-bold">Keyboard shortcuts</h2>
          </div>
          <button
            type="button"
            aria-label="Close help"
            onClick={() => setOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto nuvio-no-scrollbar">
          {SHORTCUTS.map((group) => (
            <div key={group.group}>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">
                {group.group}
              </p>
              <ul className="space-y-2">
                {group.items.map((item) => (
                  <li
                    key={item.label}
                    className="flex items-center justify-between gap-3"
                  >
                    <span className="flex items-center gap-2.5 text-sm text-foreground/90">
                      <item.icon className="h-4 w-4 text-muted-foreground" />
                      {item.label}
                    </span>
                    <span className="flex items-center gap-1">
                      {item.keys.map((k) => (
                        <kbd
                          key={k}
                          className="inline-flex h-6 min-w-6 items-center justify-center rounded-md border border-white/15 bg-white/5 px-1.5 text-xs font-mono font-semibold text-foreground/80"
                        >
                          {k}
                        </kbd>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 px-5 py-3 text-center">
          <p className="text-xs text-muted-foreground">
            Press{" "}
            <kbd className="inline-flex h-5 items-center rounded border border-white/15 bg-white/5 px-1.5 text-[10px] font-mono">
              ?
            </kbd>{" "}
            anytime to open this help
          </p>
        </div>
      </div>
    </div>
  );
}
