/**
 * Global preloader store (framework-agnostic).
 * ---------------------------------------------------------------------------
 * A tiny external store that tracks how many "loads" are currently in flight
 * anywhere in the app — a route transition, a tab switch, a popup, a data
 * fetch. The overlay appears immediately when a load starts (DELAY_MS = 0).
 * Once shown it stays up for at least MIN_VISIBLE_MS so it can't flicker in
 * and out.
 *
 * Usage:
 *   const end = beginTask(); ...; end();          // manual (tabs / popups)
 *   await withPreloader(fetch(...));              // wrap any promise
 *   await withPreloader(() => doAsyncThing());    // wrap any async fn
 *
 * The overlay component reads visibility via `subscribe` + `getSnapshot`
 * (React `useSyncExternalStore`).
 */

const DELAY_MS = 0; // show immediately — no delay before the overlay appears
const MIN_VISIBLE_MS = 450; // once shown, keep it up at least this long

let active = 0;
let visible = false;
let shownAt = 0;
let showTimer: ReturnType<typeof setTimeout> | null = null;
let hideTimer: ReturnType<typeof setTimeout> | null = null;

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

function setVisible(next: boolean) {
  if (visible === next) return;
  visible = next;
  if (next) shownAt = Date.now();
  notify();
}

function reconcile() {
  if (typeof window === "undefined") return;

  if (active > 0) {
    // Something is loading — cancel any pending hide and arm the show timer.
    if (hideTimer) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }
    if (!visible && !showTimer) {
      showTimer = setTimeout(() => {
        showTimer = null;
        if (active > 0) setVisible(true);
      }, DELAY_MS);
    }
  } else {
    // Nothing loading — cancel a pending show, and hide (respecting min time).
    if (showTimer) {
      clearTimeout(showTimer);
      showTimer = null;
    }
    if (visible && !hideTimer) {
      const remaining = Math.max(0, MIN_VISIBLE_MS - (Date.now() - shownAt));
      hideTimer = setTimeout(() => {
        hideTimer = null;
        if (active === 0) setVisible(false);
      }, remaining);
    }
  }
}

/** Register the start of a load. Call the returned fn once when it finishes. */
export function beginTask(): () => void {
  active += 1;
  reconcile();
  let ended = false;
  return () => {
    if (ended) return;
    ended = true;
    active = Math.max(0, active - 1);
    reconcile();
  };
}

/** Wrap a promise (or async fn) so the preloader tracks it automatically. */
export function withPreloader<T>(work: Promise<T> | (() => Promise<T>)): Promise<T> {
  const end = beginTask();
  const run = typeof work === "function" ? work() : work;
  return Promise.resolve(run).finally(end);
}

/** External-store subscribe — for React `useSyncExternalStore`. */
export function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

/** Current visibility snapshot. */
export function getSnapshot(): boolean {
  return visible;
}

/** Server snapshot — the overlay is never rendered on the server. */
export function getServerSnapshot(): boolean {
  return false;
}

/* ── Shared navigation task ────────────────────────────────────────────────
 * Route transitions — both <Link> clicks and programmatic router.push/replace —
 * funnel through ONE navigation task so overlapping triggers don't double-count.
 * `startNavigation` is idempotent until the matching `endNavigation` (fired when
 * the URL actually changes). A safety timeout keeps a cancelled navigation from
 * leaving the overlay stuck.
 */
let navEnd: (() => void) | null = null;
let navSafety: ReturnType<typeof setTimeout> | null = null;

export function startNavigation(): void {
  if (navEnd) return; // already tracking a transition
  navEnd = beginTask();
  if (typeof window !== "undefined") {
    navSafety = setTimeout(endNavigation, 15000);
  }
}

export function endNavigation(): void {
  if (navSafety) {
    clearTimeout(navSafety);
    navSafety = null;
  }
  if (navEnd) {
    navEnd();
    navEnd = null;
  }
}
