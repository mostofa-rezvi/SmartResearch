import { Check } from "lucide-react";

type Feature = { title: string; desc: string };
type Stat = { value: string; label: string };

/**
 * AuthShowcase — the branded editorial panel shown beside the login/register
 * forms on large screens. Intentionally always dark navy (both themes) as a
 * premium academic "cover". Kept deliberately clean: a single smooth gradient,
 * one soft glow, and a crisp inline node-graph mark (no external logo asset).
 */
export default function AuthShowcase({
  eyebrow,
  titleLead,
  titleHighlight,
  subtitle,
  features,
  stats,
}: {
  eyebrow: string;
  titleLead: string;
  titleHighlight: string;
  subtitle: string;
  features: Feature[];
  stats: Stat[];
}) {
  return (
    <aside className="relative hidden lg:flex flex-col justify-center items-center overflow-hidden bg-gradient-to-br from-primary-700 via-primary-800 to-primary-900 text-white p-12 xl:p-16 lg:sticky lg:top-20 lg:h-[calc(100vh-5rem)]">
      {/* Restrained decoration: one soft glow + a barely-there grid */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-grid opacity-[0.05]" />
        <div className="absolute -top-40 -right-24 h-[30rem] w-[30rem] rounded-full bg-accent/10 blur-[140px]" />
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/20 to-transparent" />
      </div>

      {/* Headline + value props */}
      <div className="relative z-10 max-w-md">
        <span className="inline-block text-[11px] font-black uppercase tracking-[0.22em] mono-academic text-accent-300 mb-5">
          {eyebrow}
        </span>
        <h2 className="text-4xl xl:text-5xl font-serif font-black leading-[1.08] mb-5">
          {titleLead}{" "}
          <span className="text-accent-300">{titleHighlight}</span>
        </h2>
        <p className="text-base xl:text-lg text-white/65 leading-relaxed mb-9">{subtitle}</p>

        <ul className="space-y-4">
          {features.map((f) => (
            <li key={f.title} className="flex gap-3.5 items-start">
              <span className="mt-1 w-5 h-5 rounded-full bg-accent/20 text-accent-300 flex items-center justify-center shrink-0">
                <Check size={13} strokeWidth={3} />
              </span>
              <div>
                <div className="font-bold leading-snug">{f.title}</div>
                <div className="text-sm text-white/50 leading-relaxed">{f.desc}</div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Trust stats */}
      <div className="relative z-10 grid grid-cols-3 gap-4 border-t border-white/10 pt-8 mt-12 max-w-md">
        {stats.map((s) => (
          <div key={s.label}>
            <div className="text-2xl xl:text-3xl font-serif font-black text-white">{s.value}</div>
            <div className="text-[11px] font-mono uppercase tracking-widest text-white/45 mt-1">{s.label}</div>
          </div>
        ))}
      </div>
    </aside>
  );
}
