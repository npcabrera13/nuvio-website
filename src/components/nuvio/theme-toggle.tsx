"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch — render a consistent button until mounted.
  // next-themes sets the class on <html> before hydration, so `theme` can
  // differ between server and client on first render.
  useEffect(() => setMounted(true), []);

  // Server + initial client render: static placeholder with NO theme-dependent
  // attributes. This guarantees the server and client HTML match exactly.
  if (!mounted) {
    return (
      <button
        type="button"
        aria-label="Toggle theme"
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-foreground"
      >
        <Moon className="h-4 w-4" />
      </button>
    );
  }

  // After mount: read the resolved theme and render the correct icon/label.
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-foreground hover:bg-white/10 active:scale-95 transition"
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
