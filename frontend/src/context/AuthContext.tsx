"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from "react";

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
    // Load auth data from localStorage on mount
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = useCallback((newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(newUser));
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  }, []);

  const completeOnboarding = useCallback(() => {
    const current = userRef.current;
    if (current) {
      const updatedUser = { ...current, onboarding_completed: true };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
    }
  }, []);

  const updateUser = useCallback((updates: Partial<NonNullable<User>>) => {
    const current = userRef.current;
    if (current) {
      const updatedUser = { ...current, ...updates };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
    }
  }, []);

  const updateToken = useCallback((newToken: string) => {
    setToken(newToken);
    localStorage.setItem("token", newToken);
  }, []);

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
    if (!currentToken && typeof window !== "undefined") {
      currentToken = localStorage.getItem("token");
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
