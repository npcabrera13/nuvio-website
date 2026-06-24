"use client";

import { useEffect, useRef, useState } from "react";

interface Stat {
  value: number;
  suffix: string;
  prefix?: string;
  label: string;
  decimals?: number;
}

const STATS: Stat[] = [
  { value: 10000, suffix: "+", label: "Movies & series" },
  { value: 2, suffix: "min", label: "Setup time" },
  { value: 2400, suffix: "+", label: "Happy streamers" },
  { value: 98, suffix: "%", label: "Cheaper than the rest" },
];

function useCountUp(target: number, durationMs = 1600, decimals = 0) {
  const [val, setVal] = useState(0);

  useEffect(() => {
    // Don't animate when target is 0 (not visible yet)
    if (target <= 0) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      // easeOutExpo
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      setVal(target * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
      else setVal(target);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);

  return decimals > 0 ? val.toFixed(decimals) : Math.round(val).toLocaleString();
}

function StatCard({ stat, active }: { stat: Stat; active: boolean }) {
  // Pass the real value only when active; 0 otherwise (effect skips animation for 0)
  const display = useCountUp(active ? stat.value : 0, 1600, stat.decimals ?? 0);
  return (
    <div className="text-center">
      <div className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight nuvio-gradient-text tabular-nums">
        {stat.prefix}
        {display}
        {stat.suffix}
      </div>
      <p className="mt-2 text-sm sm:text-base text-muted-foreground font-medium">
        {stat.label}
      </p>
    </div>
  );
}

export function Stats() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section ref={ref} className="relative py-10 lg:py-14">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4 py-8 lg:py-10 rounded-3xl border-y border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent">
          {STATS.map((s) => (
            <StatCard key={s.label} stat={s} active={visible} />
          ))}
        </div>
      </div>
    </section>
  );
}
