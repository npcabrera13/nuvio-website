import { UserPlus, Download, Play } from "lucide-react";

const STEPS = [
  {
    n: "01",
    icon: UserPlus,
    title: "Sign up in 60 seconds",
    desc: "Create your Nuvio account with just an email. Start your 7-day free trial — no credit card, no commitment.",
    accent: "from-violet-500 to-purple-600",
  },
  {
    n: "02",
    icon: Download,
    title: "Add the Nuvio bundle",
    desc: "One tap adds the Nuvio bundle to your Stremio app. Instantly unlocks 10,000+ titles and 27 live channels.",
    accent: "from-fuchsia-500 to-pink-600",
  },
  {
    n: "03",
    icon: Play,
    title: "Press play. That's it.",
    desc: "Browse movies, series, anime, and live TV. Nuvio auto-picks the best stream in 1080p. Grab the popcorn.",
    accent: "from-pink-500 to-rose-600",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-14 lg:py-20 overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-sm font-semibold uppercase tracking-wider text-pink-400">
            Up and running fast
          </p>
          <h2 className="mt-1 text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
            How Nuvio works
          </h2>
          <p className="mt-3 text-muted-foreground">
            From sign-up to streaming in under two minutes. No technical skills required.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3 relative">
          {/* connecting line (desktop) */}
          <div className="hidden md:block absolute top-12 left-[16.66%] right-[16.66%] h-px bg-gradient-to-r from-violet-500/30 via-pink-500/30 to-rose-500/30" />

          {STEPS.map((s) => (
            <div
              key={s.n}
              className="relative nuvio-card rounded-2xl p-6 text-center hover:-translate-y-1 transition-transform"
            >
              <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
                <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${s.accent} opacity-20 blur-xl`} />
                <div className={`relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${s.accent} text-white shadow-lg ring-1 ring-white/10`}>
                  <s.icon className="h-7 w-7" />
                </div>
                <span className="absolute -top-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#0a0a0f] text-[11px] font-extrabold text-pink-400 ring-1 ring-white/15">
                  {s.n}
                </span>
              </div>
              <h3 className="mt-5 text-lg font-bold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
