import { ReactNode } from "react";

/**
 * AppPageHeader — the shared editorial header for authenticated app pages
 * (Library, Discovery, Researchers, Community, Groups, AI Assistant).
 * Mirrors the dashboard's identity: a mono eyebrow, a large serif title with an
 * italic crimson accent, a muted subtitle, and an optional actions slot.
 */
export default function AppPageHeader({
  eyebrow,
  title,
  accent,
  subtitle,
  actions,
  className = "",
}: {
  eyebrow?: string;
  title: string;
  accent?: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header className={`flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 ${className}`}>
      <div className="min-w-0">
        {eyebrow && (
          <span className="mono-academic text-xs font-black tracking-[0.2em] text-secondary dark:text-rose-300 mb-2 block uppercase">
            {eyebrow}
          </span>
        )}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-black text-primary dark:text-white leading-[1.05]">
          {title}
          {accent && <span className="text-secondary dark:text-rose-300 italic"> {accent}</span>}
        </h1>
        {subtitle && (
          <p className="text-slate-500 dark:text-slate-400 mt-3 font-medium max-w-2xl">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
    </header>
  );
}
