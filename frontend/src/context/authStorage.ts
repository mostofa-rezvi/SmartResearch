"use client";

/**
 * Session-scoped auth storage.
 *
 * Tokens live in `sessionStorage` (not `localStorage`) on purpose: sessionStorage
 * is wiped when the browser tab/window is closed, so the user is automatically
 * logged out on close. It survives in-tab reloads and same-tab navigation, so an
 * active session is never interrupted while the tab stays open.
 */

const TOKEN_KEY = "token";
const USER_KEY = "user";

const canUseDom = () => typeof window !== "undefined";

export function getStoredToken(): string | null {
  if (!canUseDom()) return null;
  return sessionStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): string | null {
  if (!canUseDom()) return null;
  return sessionStorage.getItem(USER_KEY);
}

export function setStoredToken(token: string): void {
  if (!canUseDom()) return;
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function setStoredUser(userJson: string): void {
  if (!canUseDom()) return;
  sessionStorage.setItem(USER_KEY, userJson);
}

export function clearStoredAuth(): void {
  if (!canUseDom()) return;
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
  // Drop anything left behind by the previous localStorage-based flow so a stale
  // credential can't linger on disk after logout or after the tab is closed.
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/** Milliseconds-since-epoch when the JWT expires, or null if it can't be read. */
export function getTokenExpiryMs(token: string): number | null {
  try {
    const [, payload] = token.split(".");
    const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return typeof decoded.exp === "number" ? decoded.exp * 1000 : null;
  } catch {
    return null;
  }
}
