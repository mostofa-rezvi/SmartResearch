"use client";

/**
 * GlobalPreloader — app-wide loading overlay.
 *
 * Shows an animated ResearchBridge logo whenever *anything* loads: a page
 * transition, a tab, a popup, or a data fetch. The overlay appears immediately
 * (no delay — see DELAY_MS = 0 in `lib/preloader`).
 *
 * Two triggers are wired automatically:
 *   1) Route transitions — a capture-phase click/popstate arms the loader; the
 *      URL actually changing (usePathname/useSearchParams) disarms it.
 *   2) Authenticated data fetches — `fetchWithAuth` wraps every request.
 *
 * Anything else (a heavy popup, a client-side computation) can opt in with
 * `beginTask()` / `withPreloader()` from `@/lib/preloader`.
 */

import { Suspense, useEffect, useSyncExternalStore } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { startNavigation, endNavigation, subscribe, getSnapshot, getServerSnapshot } from "@/lib/preloader";

/** Detects <Link>/back-forward route transitions and feeds them to the store. */
function RouteChangeWatcher() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const currentUrl = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const anchor = (e.target as HTMLElement | null)?.closest?.("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return;
      const targetAttr = anchor.getAttribute("target");
      if (targetAttr && targetAttr !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      // Internal navigations only (not "//host" protocol-relative externals).
      if (!href.startsWith("/") || href.startsWith("//")) return;
      // Ignore no-op navigations to the current URL.
      if (href === pathname || href === currentUrl) return;

      startNavigation();
    };

    const onPopState = () => startNavigation();

    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPopState);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPopState);
    };
  }, [pathname, searchParams]);

  // The URL changing means the transition committed — stop tracking it.
  useEffect(() => {
    endNavigation();
  }, [pathname, searchParams]);

  return null;
}

/** The animated logo overlay itself. */
function PreloaderOverlay() {
  const visible = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="global-preloader"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/70 dark:bg-slate-950/70 backdrop-blur-md"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          {/* Animated brand mark */}
          <img
            src="/logo-animated.gif"
            alt=""
            aria-hidden
            className="w-28 h-28 object-contain drop-shadow-lg select-none"
          />
          <span className="sr-only">Loading…</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function GlobalPreloader() {
  return (
    <>
      {/* useSearchParams requires a Suspense boundary. */}
      <Suspense fallback={null}>
        <RouteChangeWatcher />
      </Suspense>
      <PreloaderOverlay />
    </>
  );
}
