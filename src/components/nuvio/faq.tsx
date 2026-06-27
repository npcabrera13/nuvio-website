"use client";

import { useState } from "react";
import { FAQS } from "@/lib/nuvio";
import { Plus, HelpCircle } from "lucide-react";

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

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

        <div className="mt-9 flex flex-col gap-3">
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
      </div>
    </section>
  );
}
