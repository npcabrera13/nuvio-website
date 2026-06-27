"use client";

import { useEffect, useState } from "react";

const SECTIONS = [
  { id: "top", label: "Home" },
  { id: "now-streaming", label: "Movies" },
  { id: "browse", label: "Browse" },
  { id: "channels", label: "Channels" },
  { id: "features", label: "App preview" },
  { id: "devices", label: "Devices" },
  { id: "compare", label: "Compare" },
  { id: "calculator", label: "Calculator" },
  { id: "pricing", label: "Pricing" },
  { id: "reviews", label: "Reviews" },
  { id: "faq", label: "FAQ" },
  { id: "trial", label: "Get started" },
];

/**
 * Sticky vertical table-of-contents shown on large desktop screens (xl+).
 * Uses IntersectionObserver scroll-spy to highlight the active section.
 */
export function TableOfContents() {
  const [active, setActive] = useState<string>("top");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only show after scrolling past the hero
    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 0.7);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the entry closest to the top that's intersecting
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) {
          setActive(visible[0].target.id);
        }
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: 0 }
    );

    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <nav
      aria-label="Page sections"
      className={`hidden xl:flex fixed left-6 top-1/2 -translate-y-1/2 z-40 flex-col gap-1 transition-all duration-300 ${
        visible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 pointer-events-none"
      }`}
    >
      <div className="nuvio-glass rounded-2xl p-2 flex flex-col gap-0.5 border border-white/10">
        {SECTIONS.map((s) => {
          const isActive = active === s.id;
          return (
            <a
              key={s.id}
              href={`#${s.id}`}
              aria-label={`Jump to ${s.label}`}
              aria-current={isActive ? "true" : undefined}
              className={`group relative flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
                isActive
                  ? "text-foreground bg-white/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              }`}
            >
              <span
                className={`h-1.5 rounded-full transition-all ${
                  isActive
                    ? "w-4 nuvio-gradient-bg"
                    : "w-1.5 bg-white/30 group-hover:w-2.5 group-hover:bg-white/50"
                }`}
              />
              <span className="whitespace-nowrap">{s.label}</span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}
