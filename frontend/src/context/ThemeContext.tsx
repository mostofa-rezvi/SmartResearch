"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";

export type Theme = "light" | "dark";

type ThemeContextType = {
  theme: Theme;
  /** Whether the user has explicitly chosen (vs. following the OS). */
  isExplicit: boolean;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
};

const STORAGE_KEY = "theme";

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/** Read the theme the anti-FOUC inline script already resolved and applied to
 *  <html>, so React state matches the DOM on first paint (no flash, no mismatch). */
function readInitialTheme(): Theme {
  if (typeof document === "undefined") return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [isExplicit, setIsExplicit] = useState(false);

  // Sync from the DOM (set by the inline script) once mounted.
  useEffect(() => {
    setThemeState(readInitialTheme());
    try {
      setIsExplicit(localStorage.getItem(STORAGE_KEY) != null);
    } catch {
      /* localStorage may be unavailable (private mode / SSR edge) */
    }
  }, []);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    setIsExplicit(true);
    applyTheme(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore persistence failure */
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  // Follow OS changes only while the user hasn't made an explicit choice.
  useEffect(() => {
    if (isExplicit) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e: MediaQueryListEvent) => {
      const next: Theme = e.matches ? "dark" : "light";
      setThemeState(next);
      applyTheme(next);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [isExplicit]);

  const value = useMemo<ThemeContextType>(
    () => ({ theme, isExplicit, toggleTheme, setTheme }),
    [theme, isExplicit, toggleTheme, setTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

/** Serialized inline script injected in <head> to set the theme before first
 *  paint — prevents a flash of the wrong theme (FOUC). Reads the saved choice,
 *  falling back to the OS preference. */
export const themeInitScript = `(function(){try{var t=localStorage.getItem('${STORAGE_KEY}');if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}var r=document.documentElement;if(t==='dark'){r.classList.add('dark');}r.style.colorScheme=t;}catch(e){}})();`;
