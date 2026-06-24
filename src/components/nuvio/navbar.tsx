"use client";

import { useEffect, useState } from "react";
import { Menu, X, Play } from "lucide-react";
import { SearchBar } from "@/components/nuvio/search-bar";
import type { NuvioMovie } from "@/lib/nuvio";

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "Channels", href: "#channels" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

interface NavbarProps {
  onOpenMovie?: (m: NuvioMovie) => void;
}

export function Navbar({ onOpenMovie }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? "nuvio-glass py-2.5" : "bg-transparent py-4"
      }`}
    >
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* Logo */}
        <a href="#top" className="flex items-center gap-2.5 shrink-0">
          <img
            src="https://i.ibb.co/J91qPG0/Logo-1080x1080.png"
            alt="Nuvio"
            width={36}
            height={36}
            className="h-9 w-9 rounded-lg object-cover ring-1 ring-white/10"
          />
          <span className="text-xl font-bold tracking-tight">Nuvio</span>
        </a>

        {/* Desktop links */}
        <div className="hidden lg:flex items-center gap-1">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-white/5"
            >
              {l.label}
            </a>
          ))}
        </div>

        {/* Desktop CTAs */}
        <div className="hidden lg:flex items-center gap-3">
          <SearchBar onOpenMovie={onOpenMovie} />
          <a
            href="#login"
            className="px-4 py-2.5 text-sm font-semibold text-foreground/90 hover:text-foreground transition-colors"
          >
            Login
          </a>
          <a
            href="#trial"
            className="nuvio-gradient-bg nuvio-glow inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.03] active:scale-95"
          >
            Get 7 Days Free
            <Play className="h-3.5 w-3.5 fill-current" />
          </a>
        </div>

        {/* Mobile: search + primary CTA + hamburger */}
        <div className="flex items-center gap-2 lg:hidden">
          <SearchBar onOpenMovie={onOpenMovie} />
          <a
            href="#trial"
            className="nuvio-gradient-bg inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold text-white active:scale-95 transition-transform"
          >
            7 Days Free
          </a>
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-foreground active:scale-95 transition"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      <div
        className={`lg:hidden overflow-hidden transition-[max-height,opacity] duration-300 ${
          open ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="mx-4 mt-3 rounded-2xl nuvio-glass p-3 flex flex-col gap-1">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="px-4 py-3 text-base font-medium text-foreground/90 hover:bg-white/5 rounded-xl transition-colors"
            >
              {l.label}
            </a>
          ))}
          <a
            href="#login"
            onClick={() => setOpen(false)}
            className="px-4 py-3 text-base font-semibold text-foreground hover:bg-white/5 rounded-xl transition-colors"
          >
            Login
          </a>
          <a
            href="#trial"
            onClick={() => setOpen(false)}
            className="nuvio-gradient-bg mt-1 inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-base font-semibold text-white"
          >
            Get 7 Days Free
            <Play className="h-4 w-4 fill-current" />
          </a>
        </div>
      </div>
    </header>
  );
}
