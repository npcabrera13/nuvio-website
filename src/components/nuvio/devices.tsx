import { Smartphone, Tv, Monitor, Cast, Apple, Gamepad2 } from "lucide-react";

const DEVICES = [
  { icon: Smartphone, name: "Android Phone", note: "5.0+" },
  { icon: Apple, name: "iPhone & iPad", note: "iOS 14+" },
  { icon: Tv, name: "Android TV", note: "Sony, TCL, more" },
  { icon: Monitor, name: "Windows & Mac", note: "Web + Desktop" },
  { icon: Cast, name: "Chromecast / AirPlay", note: "Cast to any TV" },
  { icon: Gamepad2, name: "Fire Stick & more", note: "Amazon Fire OS" },
];

export function Devices() {
  return (
    <section id="devices" className="relative py-14 lg:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="nuvio-card rounded-3xl p-6 sm:p-10 lg:p-12 overflow-hidden relative">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_80%_20%,rgba(124,58,237,0.12),transparent_50%)]" />
          <div className="grid lg:grid-cols-[1fr_1.2fr] gap-8 lg:gap-12 items-center">
            {/* Left: copy */}
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-pink-400">
                Watch anywhere
              </p>
              <h2 className="mt-1 text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
                One account. Every screen.
              </h2>
              <p className="mt-3 text-muted-foreground">
                Start a movie on your phone during the commute, finish it on your TV at home. Nuvio syncs across all your devices automatically.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {["No extra device fees", "Up to 2 simultaneous streams", "Offline-friendly"].map((t) => (
                  <span key={t} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-foreground/80">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Right: device grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {DEVICES.map((d) => (
                <div
                  key={d.name}
                  className="group rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-center hover:border-violet-500/30 hover:bg-white/[0.06] transition-all hover:-translate-y-0.5"
                >
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-pink-500/20 text-violet-300 ring-1 ring-white/10 group-hover:scale-110 transition-transform">
                    <d.icon className="h-6 w-6" />
                  </div>
                  <p className="mt-3 text-sm font-semibold leading-tight">{d.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{d.note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
