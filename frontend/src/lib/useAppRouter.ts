"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { startNavigation } from "@/lib/preloader";

type NextRouter = ReturnType<typeof useRouter>;

/**
 * Drop-in replacement for next/navigation's `useRouter` that feeds programmatic
 * navigations into the global preloader — the same animated-logo overlay that
 * <Link> clicks trigger. `push` and `replace` register a navigation task (only
 * shown if the transition runs past 0.7s); everything else (back, forward,
 * refresh, prefetch) is passed through untouched.
 */
export function useAppRouter(): NextRouter {
  const router = useRouter();
  return useMemo<NextRouter>(
    () => ({
      ...router,
      push: (href, options) => {
        startNavigation();
        return router.push(href, options);
      },
      replace: (href, options) => {
        startNavigation();
        return router.replace(href, options);
      },
    }),
    [router]
  );
}
