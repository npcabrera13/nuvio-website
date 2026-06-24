"use client";

import { useState } from "react";
import { Facebook, Instagram, Youtube, Mail, Send, CheckCircle, Loader2 } from "lucide-react";

const FOOTER_COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "Channels", href: "#channels" },
      { label: "Pricing", href: "#pricing" },
      { label: "Reviews", href: "#reviews" },
      { label: "FAQ", href: "#faq" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help Center", href: "#support" },
      { label: "Setup Guide", href: "#support" },
      { label: "Contact Us", href: "#support" },
      { label: "Live Chat", href: "#support" },
      { label: "System Status", href: "#support" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms of Service", href: "#legal" },
      { label: "Privacy Policy", href: "#legal" },
      { label: "Refund Policy", href: "#legal" },
      { label: "Content Disclaimer", href: "#legal" },
      { label: "DMCA", href: "#legal" },
    ],
  },
];

export function Footer() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setErrorMsg(data.error ?? "Something went wrong.");
        return;
      }
      setStatus("success");
      setEmail("");
    } catch {
      setStatus("error");
      setErrorMsg("Network error. Please try again.");
    }
  };

  return (
    <footer className="mt-auto border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 lg:py-16">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          {/* Brand column + newsletter */}
          <div>
            <a href="#top" className="flex items-center gap-2.5">
              <img
                src="https://i.ibb.co/J91qPG0/Logo-1080x1080.png"
                alt="Nuvio"
                width={36}
                height={36}
                className="h-9 w-9 rounded-lg object-cover"
              />
              <span className="text-xl font-bold tracking-tight">Nuvio</span>
            </a>
            <p className="mt-4 text-sm text-muted-foreground max-w-xs leading-relaxed">
              All your streaming in one Philippine app. Movies, series, anime, and 27 live channels — from ₱49/month.
            </p>

            {/* Newsletter signup */}
            <div className="mt-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Get streaming tips &amp; new releases
              </p>
              {status === "success" ? (
                <div className="flex items-center gap-2 rounded-xl border border-green-500/30 bg-green-500/10 px-3.5 py-2.5 text-sm text-green-300">
                  <CheckCircle className="h-4 w-4 shrink-0" />
                  Subscribed! Watch your inbox.
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex gap-2">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    aria-label="Newsletter email"
                    className="flex-1 min-w-0 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-violet-500/40"
                  />
                  <button
                    type="submit"
                    disabled={status === "loading"}
                    aria-label="Subscribe to newsletter"
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg nuvio-gradient-bg text-white disabled:opacity-60 active:scale-95 transition-transform"
                  >
                    {status === "loading" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </button>
                </form>
              )}
              {status === "error" && errorMsg && (
                <p className="mt-1.5 text-xs text-red-400">{errorMsg}</p>
              )}
              <span className="sr-only" aria-live="polite">
                {status === "loading"
                  ? "Subscribing"
                  : status === "success"
                    ? "Successfully subscribed"
                    : status === "error"
                      ? `Error: ${errorMsg}`
                      : ""}
              </span>
            </div>

            <div className="mt-5 flex items-center gap-2">
              {[
                { Icon: Facebook, label: "Facebook" },
                { Icon: Instagram, label: "Instagram" },
                { Icon: Youtube, label: "YouTube" },
                { Icon: Mail, label: "Email" },
              ].map(({ Icon, label }) => (
                <a
                  key={label}
                  href="#social"
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold text-foreground">{col.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/10 pt-6">
          <p className="text-xs text-muted-foreground text-center sm:text-left">
            © {new Date().getFullYear()} Nuvio. All rights reserved. Made in the Philippines.
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400" /> All systems operational
            </span>
            <span>·</span>
            <span>v1.4.1</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
