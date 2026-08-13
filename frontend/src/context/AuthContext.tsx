"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  getStoredToken,
  getStoredUser,
  setStoredToken,
  setStoredUser,
  clearStoredAuth,
  getTokenExpiryMs,
} from "./authStorage";

type User = {
  id: string;
  name: string;
  role: 'super_admin' | 'admin' | 'user' | 'invited_user';
  researcher_type?: 'new_researcher' | 'amateur_researcher';
  onboarding_completed: boolean;
  research_interests?: any;
} | null;

type AuthContextType = {
  user: User;
  token: string | null;
  login: (token: string, user: NonNullable<User>) => void;
  logout: () => void;
  completeOnboarding: () => void;
  isLoading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  updateUser: (updates: Partial<NonNullable<User>>) => void;
  updateToken: (newToken: string) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Keep a live ref to `user` so identity-stable callbacks can read the latest
  // value without listing `user` as a dependency (which would churn identities).
  const userRef = useRef<User>(user);
  useEffect(() => { userRef.current = user; }, [user]);

  useEffect(() => {
    // Restore the session from sessionStorage on mount. sessionStorage is scoped
    // to the tab and cleared when it closes, which is what gives us "log out on
    // tab/browser close". `clearStoredAuth` also removes any credential left in
    // localStorage by the previous (persistent) build.
    const savedToken = getStoredToken();
    const savedUser = getStoredUser();

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    } else if (typeof window !== "undefined" && (localStorage.getItem("token") || localStorage.getItem("user"))) {
      // Legacy cleanup: an old localStorage token would otherwise keep the user
      // "logged in" across tab closes, defeating the new session model.
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
    setIsLoading(false);
  }, []);

  const login = useCallback((newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    setStoredToken(newToken);
    setStoredUser(JSON.stringify(newUser));
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    clearStoredAuth();
    window.location.href = "/login";
  }, []);

  const completeOnboarding = useCallback(() => {
    const current = userRef.current;
    if (current) {
      const updatedUser = { ...current, onboarding_completed: true };
      setUser(updatedUser);
      setStoredUser(JSON.stringify(updatedUser));
    }
  }, []);

  const updateUser = useCallback((updates: Partial<NonNullable<User>>) => {
    const current = userRef.current;
    if (current) {
      const updatedUser = { ...current, ...updates };
      setUser(updatedUser);
      setStoredUser(JSON.stringify(updatedUser));
    }
  }, []);

  const updateToken = useCallback((newToken: string) => {
    setToken(newToken);
    setStoredToken(newToken);
  }, []);

  // Keep the session alive while the tab is open: proactively refresh the
  // short-lived (15 min) access token ~1 minute before it expires so an active
  // user is never bounced to the login screen mid-session.
  useEffect(() => {
    if (!token) return;
    const expMs = getTokenExpiryMs(token);
    const delay = expMs
      ? Math.max(expMs - Date.now() - 60_000, 5_000) // refresh 1 min before expiry
      : 13 * 60_000;                                  // fallback if exp is unreadable
    const timer = window.setTimeout(() => {
      refreshTokenDeduplicated(logout, updateToken);
    }, delay);
    return () => window.clearTimeout(timer);
  }, [token, logout, updateToken]);

  // Timers are frozen while the machine sleeps or the tab is backgrounded, so
  // also refresh when the tab regains focus if the token is at/near expiry.
  useEffect(() => {
    const refreshIfStale = () => {
      const current = getStoredToken();
      if (!current) return;
      const expMs = getTokenExpiryMs(current);
      if (!expMs || expMs - Date.now() < 2 * 60_000) {
        refreshTokenDeduplicated(logout, updateToken);
      }
    };
    window.addEventListener("focus", refreshIfStale);
    document.addEventListener("visibilitychange", refreshIfStale);
    return () => {
      window.removeEventListener("focus", refreshIfStale);
      document.removeEventListener("visibilitychange", refreshIfStale);
    };
  }, [logout, updateToken]);

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const isSuperAdmin = user?.role === 'super_admin';

  const value = useMemo<AuthContextType>(() => ({
    user, token, login, logout, completeOnboarding, isLoading, isAdmin, isSuperAdmin, updateUser, updateToken,
  }), [user, token, login, logout, completeOnboarding, isLoading, isAdmin, isSuperAdmin, updateUser, updateToken]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

let refreshingPromise: Promise<string | null> | null = null;

async function refreshTokenDeduplicated(logout: () => void, updateToken: (t: string) => void): Promise<string | null> {
  if (refreshingPromise) {
    return refreshingPromise;
  }

  refreshingPromise = (async () => {
    try {
      const refreshResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000'}/api/v1/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });

      if (refreshResponse.ok) {
        const json = await refreshResponse.json();
        if (json.success && json.data?.accessToken) {
          const newToken = json.data.accessToken;
          updateToken(newToken);
          return newToken;
        }
      }
      logout();
      return null;
    } catch (err) {
      logout();
      return null;
    } finally {
      refreshingPromise = null;
    }
  })();

  return refreshingPromise;
}

export function useApi() {
  const { token, updateToken, logout } = useAuth();

  // Memoized so its identity is stable across renders. Components put
  // `fetchWithAuth` in effect/useCallback dependency arrays; an unstable
  // identity would re-fire those effects every render and hammer the API.
  const fetchWithAuth = useCallback(async (input: RequestInfo | URL, init?: RequestInit) => {
    let currentToken = token;
    if (!currentToken) {
      currentToken = getStoredToken();
    }

    const headers = new Headers(init?.headers);
    if (currentToken && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${currentToken}`);
    }

    const requestInit: RequestInit = {
      ...init,
      headers,
      credentials: init?.credentials || 'include',
    };
    let response = await fetch(input, requestInit);

    if (response.status === 401) {
      const newToken = await refreshTokenDeduplicated(logout, updateToken);
      if (newToken) {
        headers.set("Authorization", `Bearer ${newToken}`);
        response = await fetch(input, { ...init, headers, credentials: init?.credentials || 'include' });
      }
    }

    return response;
  }, [token, updateToken, logout]);

  return { fetchWithAuth };
}
