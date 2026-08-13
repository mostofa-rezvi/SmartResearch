"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useEffect, useState } from "react";

/**
 * Light/Dark theme toggle for the navbar. Renders a segmented pill switch so
 * the current mode is always legible (not just an icon whose meaning is
 * ambiguous). Hydration-safe: renders a neutral placeholder until mounted so
 * the server markup and client markup agree.
 */
export default function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      role="switch"
      aria-checked={isDark}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
      className={`skeuo-pill focus-ring relative inline-flex h-9 w-16 items-center rounded-full p-1 transition-colors ${className}`}
    >
      {/* Track icons */}
      <span className="pointer-events-none absolute inset-0 flex items-center justify-between px-2">
        <Sun size={14} className={`transition-colors ${!isDark ? "text-accent-500" : "text-ink-400"}`} />
        <Moon size={14} className={`transition-colors ${isDark ? "text-accent-400" : "text-ink-400"}`} />
      </span>
      {/* Sliding knob */}
      <span
        className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-md transition-transform duration-300 ease-out dark:bg-slate-900 ${
          mounted && isDark ? "translate-x-7" : "translate-x-0"
        }`}
      >
        {isDark ? (
          <Moon size={13} className="text-accent-400" />
        ) : (
          <Sun size={13} className="text-accent-500" />
        )}
      </span>
    </button>
  );
}
