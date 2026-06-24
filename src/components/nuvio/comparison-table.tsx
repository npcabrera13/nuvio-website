import { Check, X } from "lucide-react";
import { COMPARISON_COLUMNS, COMPARISON_FEATURES } from "@/lib/nuvio";

function CellValue({ value, highlight }: { value: string | boolean; highlight?: boolean }) {
  if (value === true) {
    return (
      <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full ${highlight ? "bg-green-500/20 text-green-400" : "bg-white/5 text-green-400"}`}>
        <Check className="h-3.5 w-3.5" />
      </span>
    );
  }
  if (value === false) {
    return (
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/5 text-muted-foreground/50">
        <X className="h-3.5 w-3.5" />
      </span>
    );
  }
  return (
    <span className={`text-xs sm:text-sm font-medium ${highlight ? "text-foreground font-bold" : "text-muted-foreground"}`}>
      {value}
    </span>
  );
}

export function ComparisonTable() {
  return (
    <section id="compare" className="relative py-14 lg:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-9">
          <p className="text-sm font-semibold uppercase tracking-wider text-pink-400">
            The full picture
          </p>
          <h2 className="mt-1 text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
            Nuvio vs. everyone else
          </h2>
          <p className="mt-3 text-muted-foreground">
            One transparent plan that beats every major service on value.
          </p>
        </div>

        <div className="nuvio-card rounded-3xl overflow-hidden">
          {/* Desktop / tablet table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left p-4 text-sm font-semibold text-muted-foreground w-1/4">
                    Feature
                  </th>
                  {COMPARISON_COLUMNS.map((col, i) => (
                    <th
                      key={col}
                      className={`p-4 text-center ${i === 0 ? "relative" : ""}`}
                    >
                      {i === 0 ? (
                        <div className="flex flex-col items-center gap-1">
                          <span className="inline-flex items-center justify-center rounded-md bg-gradient-to-r from-violet-600 to-pink-600 px-2 py-0.5 text-[10px] font-bold text-white">
                            BEST VALUE
                          </span>
                          <span className="text-base font-extrabold nuvio-gradient-text">{col}</span>
                        </div>
                      ) : (
                        <span className="text-sm font-bold text-foreground/80">{col}</span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARISON_FEATURES.map((f, ri) => (
                  <tr
                    key={f.label}
                    className={`border-b border-white/5 hover:bg-white/[0.02] transition-colors ${ri % 2 === 0 ? "bg-white/[0.015]" : ""}`}
                  >
                    <td className="p-4 text-sm font-medium text-foreground/90">{f.label}</td>
                    {f.values.map((v, ci) => (
                      <td
                        key={ci}
                        className={`p-4 text-center ${ci === 0 ? "bg-violet-500/[0.06]" : ""}`}
                      >
                        <CellValue value={v} highlight={ci === 0} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: stacked cards */}
          <div className="md:hidden divide-y divide-white/5">
            {COMPARISON_FEATURES.map((f) => (
              <div key={f.label} className="p-4">
                <p className="text-sm font-semibold text-foreground/90 mb-2">{f.label}</p>
                <div className="grid grid-cols-5 gap-1.5">
                  {COMPARISON_COLUMNS.map((col, ci) => (
                    <div key={col} className="flex flex-col items-center gap-1">
                      <span className={`text-[9px] font-medium ${ci === 0 ? "nuvio-gradient-text font-bold" : "text-muted-foreground/70"}`}>
                        {col.replace(" Video", "")}
                      </span>
                      <CellValue value={f.values[ci]} highlight={ci === 0} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Prices reflect standard monthly plans as of 2026. Nuvio includes all libraries bundled.
        </p>
      </div>
    </section>
  );
}
