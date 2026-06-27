import { REVIEWS } from "@/lib/nuvio";
import { Star, Quote } from "lucide-react";

export function Reviews() {
  return (
    <section id="reviews" className="relative py-14 lg:py-20 overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute -left-20 top-1/3 h-72 w-72 rounded-full bg-fuchsia-600/10 blur-[110px]" />
        <div className="absolute -right-20 bottom-1/4 h-72 w-72 rounded-full bg-violet-600/10 blur-[110px]" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-sm font-semibold uppercase tracking-wider text-pink-400">
            Loved by users
          </p>
          <h2 className="mt-1 text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
            2,400+ happy streamers
          </h2>
          <div className="mt-3 flex items-center justify-center gap-2">
            <div className="flex">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">4.9 / 5 average rating</span>
          </div>
        </div>

        <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {REVIEWS.map((r, i) => (
            <figure
              key={r.name}
              className="nuvio-card rounded-2xl p-6 flex flex-col transition-all hover:-translate-y-1 hover:border-white/15"
            >
              <Quote className="h-7 w-7 text-violet-500/60 mb-3" />
              <blockquote className="flex-1">
                <p className="text-sm sm:text-base italic text-foreground/90 leading-relaxed">
                  “{r.text}”
                </p>
              </blockquote>
              <div className="mt-4 flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, s) => (
                  <Star key={s} className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <figcaption className="mt-4 flex items-center gap-3 border-t border-white/10 pt-4">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${r.gradient} text-sm font-bold text-white ring-2 ring-white/10`}
                >
                  {r.initial}
                </div>
                <div>
                  <p className="text-sm font-semibold">{r.name}</p>
                  <p className="text-xs text-muted-foreground">{r.location}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
