/**
 * HeroBackdrop — a full-bleed decorative background for marketing page heroes.
 *
 * Marketing heroes are centered text columns; on wide screens that leaves large
 * blank gutters on the left/right. This component breaks out of its constrained
 * parent (`w-screen` + centre translate) and fills those gutters with layered,
 * theme-aware decoration: soft colour glows, a masked dot-grid, and concentric
 * "orbital" rings that echo the node-graph brand mark.
 *
 * Usage: place as the FIRST child of a `relative isolate` hero wrapper.
 *   <section className="relative isolate ...">
 *     <HeroBackdrop />
 *     ...centered content...
 *   </section>
 */
export default function HeroBackdrop({
  tone = "primary",
}: {
  /** Accent colour that leads the composition. */
  tone?: "primary" | "secondary" | "accent" | "emerald";
}) {
  const glow: Record<string, string> = {
    primary: "bg-primary/15 dark:bg-primary/30",
    secondary: "bg-secondary/15 dark:bg-secondary/25",
    accent: "bg-accent/15 dark:bg-accent/20",
    emerald: "bg-emerald-400/15 dark:bg-emerald-500/20",
  };

  return (
    <div
      aria-hidden
      /* Extends ~8rem ABOVE the hero so the decoration runs up behind the fixed,
         translucent navbar — the frosted glass blurs it, blending the navbar into
         the page instead of leaving a plain white band beneath it. */
      className="pointer-events-none absolute left-1/2 -top-32 -z-10 h-[calc(100%+8rem)] w-screen -translate-x-1/2 overflow-hidden"
    >
      {/* Masked dot-grid — fades out toward the edges and bottom */}
      <div className="absolute inset-0 bg-grid opacity-70 [mask-image:radial-gradient(ellipse_78%_62%_at_50%_8%,#000_38%,transparent_100%)]" />

      {/* Colour glows filling the side gutters */}
      <div className={`absolute -left-28 -top-20 h-[34rem] w-[34rem] rounded-full blur-[120px] ${glow[tone]}`} />
      <div className="absolute -right-28 top-4 h-[32rem] w-[32rem] rounded-full bg-secondary/12 blur-[120px] dark:bg-secondary/25" />
      <div className="absolute left-1/2 -top-28 h-[24rem] w-[46rem] -translate-x-1/2 rounded-full bg-accent/10 blur-[130px] dark:bg-accent/12" />

      {/* Concentric orbital rings — left gutter */}
      <div className="absolute -left-48 top-1/2 hidden -translate-y-1/2 rounded-full border border-primary/10 dark:border-white/10 lg:block h-[34rem] w-[34rem]" />
      <div className="absolute -left-28 top-1/2 hidden -translate-y-1/2 rounded-full border border-dashed border-primary/15 dark:border-white/[0.08] lg:block h-[22rem] w-[22rem]" />
      {/* Concentric orbital rings — right gutter */}
      <div className="absolute -right-48 top-1/2 hidden -translate-y-1/2 rounded-full border border-secondary/10 dark:border-white/10 lg:block h-[34rem] w-[34rem]" />
      <div className="absolute -right-28 top-1/2 hidden -translate-y-1/2 rounded-full border border-dashed border-secondary/15 dark:border-white/[0.08] lg:block h-[22rem] w-[22rem]" />

      {/* Accent nodes sitting on the rings */}
      <div className="absolute left-[9%] top-[32%] hidden h-2.5 w-2.5 rounded-full bg-accent shadow-[0_0_18px_4px] shadow-accent/40 lg:block" />
      <div className="absolute left-[5%] top-[60%] hidden h-2 w-2 rounded-full bg-primary/60 lg:block dark:bg-white/50" />
      <div className="absolute right-[10%] top-[28%] hidden h-2 w-2 rounded-full bg-secondary shadow-lg lg:block" />
      <div className="absolute right-[6%] top-[64%] hidden h-2.5 w-2.5 rounded-full bg-accent/80 shadow-[0_0_18px_4px] shadow-accent/30 lg:block" />

      {/* Fade the whole composition into the page background at the bottom */}
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-white dark:to-[#020617]" />
    </div>
  );
}
