"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

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

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  const completeOnboarding = () => {
    if (user) {
      const updatedUser = { ...user, onboarding_completed: true };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
    }
  };

  const updateUser = (updates: Partial<NonNullable<User>>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
    }
  };

  const updateToken = (newToken: string) => {
    setToken(newToken);
    localStorage.setItem("token", newToken);
  };

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const isSuperAdmin = user?.role === 'super_admin';

  return (
    <AuthContext.Provider value={{ user, token, login, logout, completeOnboarding, isLoading, isAdmin, isSuperAdmin, updateUser, updateToken }}>
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

export function useApi() {
  const { token, updateToken, logout } = useAuth();

  const fetchWithAuth = async (input: RequestInfo | URL, init?: RequestInit) => {
    let currentToken = token;
    if (!currentToken && typeof window !== "undefined") {
      currentToken = localStorage.getItem("token");
    }

    const headers = new Headers(init?.headers);
    if (currentToken && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${currentToken}`);
    }

    const requestInit = { ...init, headers };
    let response = await fetch(input, requestInit);

    if (response.status === 401) {
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
            headers.set("Authorization", `Bearer ${newToken}`);
            response = await fetch(input, { ...init, headers });
          } else {
            logout();
          }
        } else {
          logout();
        }
      } catch (err) {
        logout();
      }
    }

    return response;
  };

  return { fetchWithAuth };
}
