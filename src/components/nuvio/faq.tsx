"use client";

import { useState } from "react";
import { FAQS } from "@/lib/nuvio";
import { Plus, HelpCircle, ChevronLeft, ChevronRight } from "lucide-react";

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  const [mobileIndex, setMobileIndex] = useState(0);

  const scrollMobile = (dir: "left" | "right") => {
    if (dir === "left") {
      setMobileIndex((i) => Math.max(0, i - 1));
    } else {
      setMobileIndex((i) => Math.min(FAQS.length - 1, i + 1));
    }
  };

  return (
    <section id="faq" className="relative py-14 lg:py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-sm font-semibold uppercase tracking-wider text-pink-400">
            Questions, answered
          </p>
          <h2 className="mt-1 text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
            Frequently asked questions
          </h2>
          <p className="mt-3 text-muted-foreground">
            Everything you need to know before you start streaming.
          </p>
        </div>

        {/* Desktop: vertical accordion */}
        <div className="hidden lg:flex flex-col gap-3 mt-9">
          {FAQS.map((item, i) => {
            const isOpen = open === i;
            return (
              <div
                key={i}
                className={`nuvio-card rounded-2xl overflow-hidden transition-colors ${
                  isOpen ? "border-violet-500/30" : ""
                }`}
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center gap-4 px-5 py-4 sm:px-6 sm:py-5 text-left"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5 text-violet-300 ring-1 ring-white/10">
                    <HelpCircle className="h-4.5 w-4.5" />
                  </span>
                  <span className="flex-1 text-sm sm:text-base font-semibold pr-2">
                    {item.q}
                  </span>
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${
                      isOpen
                        ? "nuvio-gradient-bg rotate-[135deg] text-white border-transparent"
                        : "border-white/15 text-muted-foreground"
                    }`}
                  >
                    <Plus className="h-4 w-4" />
                  </span>
                </button>
                <div
                  className={`grid transition-all duration-300 ease-out ${
                    isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="px-5 pb-5 sm:px-6 sm:pb-6 pl-[4.25rem] sm:pl-[4.75rem] text-sm leading-relaxed text-muted-foreground">
                      {item.a}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile: horizontal card carousel */}
        <div className="lg:hidden mt-9">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => scrollMobile("left")}
              disabled={mobileIndex === 0}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-muted-foreground disabled:opacity-30 transition"
              aria-label="Previous question"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs text-muted-foreground">
              {mobileIndex + 1} / {FAQS.length}
            </span>
            <button
              onClick={() => scrollMobile("right")}
              disabled={mobileIndex === FAQS.length - 1}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-muted-foreground disabled:opacity-30 transition"
              aria-label="Next question"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-300 ease-out"
              style={{ transform: `translateX(-${mobileIndex * 100}%)` }}
            >
              {FAQS.map((item, i) => (
                <div key={i} className="w-full shrink-0 px-1">
                  <div className="nuvio-card rounded-2xl p-5 min-h-[180px]">
                    <div className="flex items-center gap-2.5 mb-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 text-violet-300 ring-1 ring-white/10">
                        <HelpCircle className="h-4 w-4" />
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                        Question {i + 1}
                      </span>
                    </div>
                    <h3 className="text-base font-bold mb-3 leading-snug">{item.q}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {item.a}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dots indicator */}
          <div className="flex items-center justify-center gap-1.5 mt-4">
            {FAQS.map((_, i) => (
              <button
                key={i}
                onClick={() => setMobileIndex(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === mobileIndex ? "w-6 nuvio-gradient-bg" : "w-1.5 bg-white/20"
                }`}
                aria-label={`Go to question ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
