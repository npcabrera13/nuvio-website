"use client";

import { useState, useEffect } from "react";
import { Gift, Copy, Check, Share2, Users } from "lucide-react";

/**
 * Referral program section.
 * Generates a unique referral code from localStorage (persists per browser),
 * builds a shareable link, and offers copy + native share buttons.
 * No backend required — the code is client-generated.
 */
export function Referral() {
  const [code, setCode] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      let c = localStorage.getItem("nuvio-referral-code");
      if (!c) {
        // Generate a readable code: NUVRIO-XXXXXX
        const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
        c =
          "NUVRIO-" +
          Array.from({ length: 6 })
            .map(() => chars[Math.floor(Math.random() * chars.length)])
            .join("");
        localStorage.setItem("nuvio-referral-code", c);
      }
      setCode(c);
    } catch {
      setCode("NUVRIO-WELCOME");
    }
  }, []);

  const link = mounted ? `${typeof window !== "undefined" ? window.location.origin : ""}/?ref=${code}` : "";

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const shareLink = async () => {
    const text = `I'm saving ₱2,600/month on streaming with Nuvio — all my movies, series, and 27 live channels for just ₱49/month. Use my referral code ${code} to get 7 days free! 💜`;
    if (navigator.share) {
      navigator.share({ title: "Nuvio — all your streaming, one app", text, url: link }).catch(() => {});
    } else {
      copyLink();
    }
  };

  return (
    <section id="referral" className="relative py-14 lg:py-20 overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/2 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-fuchsia-600/10 blur-[120px]" />
      </div>

      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="nuvio-card rounded-3xl p-6 sm:p-10 relative overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_70%_30%,rgba(236,72,153,0.1),transparent_50%)]" />

          <div className="flex flex-col sm:flex-row items-start gap-5">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl nuvio-gradient-bg text-white shadow-lg shadow-violet-900/30">
              <Gift className="h-7 w-7" />
            </span>
            <div className="flex-1">
              <p className="text-sm font-semibold uppercase tracking-wider text-pink-400">
                Refer &amp; earn
              </p>
              <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight">
                Give 7 days free, get 7 days free
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Share your referral link with friends. When they start their free trial, you both get an extra 7 days — free.
              </p>
            </div>
          </div>

          {/* Referral code + link */}
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/50 px-4 py-3">
              <div>
                <p className="text-xs text-muted-foreground">Your referral code</p>
                <p className="text-lg font-bold tracking-wider nuvio-gradient-text">
                  {mounted ? code : "NUVRIO-……"}
                </p>
              </div>
              <Users className="h-5 w-5 text-muted-foreground" />
            </div>

            {/* Link + actions */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 min-w-0 rounded-xl border border-border bg-secondary/30 px-4 py-3">
                <p className="text-xs text-muted-foreground mb-0.5">Your referral link</p>
                <p className="text-sm font-mono truncate text-foreground/90">
                  {mounted ? link : "loading…"}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={copyLink}
                  aria-label="Copy referral link"
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-secondary px-4 py-3 text-sm font-semibold hover:bg-secondary/80 active:scale-95 transition"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 text-green-400" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" /> Copy
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={shareLink}
                  aria-label="Share referral link"
                  className="nuvio-gradient-bg inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-3 text-sm font-semibold text-white active:scale-95 transition-transform"
                >
                  <Share2 className="h-4 w-4" /> Share
                </button>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="mt-6 grid grid-cols-3 gap-3">
            {[
              { value: "7", label: "Days they get" },
              { value: "7", label: "Days you get" },
              { value: "∞", label: "Friends you can refer" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-border bg-secondary/30 p-3 text-center">
                <p className="text-2xl font-extrabold nuvio-gradient-text">{s.value}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
