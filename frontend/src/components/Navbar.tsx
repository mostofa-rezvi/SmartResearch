"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Search, Users, BookOpen, Compass, MessageSquare, ChevronRight, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { NotificationBell } from "@/components/NotificationBell";

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const [showOnboardingPrompt, setShowOnboardingPrompt] = useState(true);
  const pathname = usePathname();

  const isEditingProfile = pathname === "/onboarding" || pathname === "/profile/edit-interests";
  const [showResources, setShowResources] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowResources(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <AnimatePresence>
        {user && !user.onboarding_completed && showOnboardingPrompt && !isEditingProfile && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-[100] bg-card dark:bg-slate-800 rounded-xl elev-3 border border-primary-100 dark:border-primary/20 p-5 max-w-sm"
          >
            <button
              onClick={() => setShowOnboardingPrompt(false)}
              aria-label="Dismiss"
              className="focus-ring absolute top-3 right-3 rounded-md p-1 text-ink-400 hover:text-ink-600 dark:hover:text-slate-300"
            >
              <X size={16} />
            </button>
            <h3 className="text-h4 text-ink-900 dark:text-white mb-2 pr-6">Complete your profile</h3>
            <p className="text-caption text-ink-500 dark:text-slate-400 mb-4">
              Get personalized research recommendations and connect with peers by finishing your onboarding.
            </p>
            <Link
              href="/onboarding"
              onClick={() => setShowOnboardingPrompt(false)}
              className="btn btn-primary btn-sm w-full"
            >
              Finish onboarding
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      <nav className="fixed top-0 left-0 right-0 z-50 glass-morphism h-20 flex items-center px-6 md:px-12 justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10 flex items-center justify-center">
              <div className="absolute inset-0 bg-primary rounded-xl rotate-3 group-hover:rotate-6 transition-transform" />
              <div className="absolute inset-0 bg-secondary rounded-xl -rotate-3 group-hover:-rotate-6 transition-transform opacity-80" />
              <div className="relative z-10 w-8 h-8 bg-white rounded-lg flex items-center justify-center overflow-hidden">
                <div className="w-4 h-0.5 bg-primary absolute top-3" />
                <div className="w-5 h-4 border-2 border-primary rounded-t-full mt-2" />
              </div>
            </div>
            <span className="text-2xl font-serif font-black tracking-tight text-primary">
              ResearchBridge
            </span>
          </Link>

          {/* Essential Navigation */}
          {user && (
            <div className="hidden lg:flex items-center gap-7 text-[15px] font-semibold text-ink-600">
              <Link href="/library" className="hover:text-primary transition-colors">Library</Link>
              <Link href="/discovery" className="hover:text-primary transition-colors">Discovery</Link>
              <Link href="/researchers" className="hover:text-primary transition-colors">Researchers</Link>
              <Link href="/community" className="hover:text-primary transition-colors">Community</Link>
              <Link href="/groups" className="hover:text-primary transition-colors">Groups</Link>
              <Link href="/assistant" className="hover:text-primary transition-colors">AI Assistant</Link>
            </div>
          )}
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-6 text-[15px] font-medium text-ink-500 relative" ref={dropdownRef}>
            <button
              onClick={() => setShowResources(!showResources)}
              aria-expanded={showResources}
              className="focus-ring flex items-center gap-1 rounded-md px-1 py-0.5 hover:text-primary transition-colors"
            >
              Resources <ChevronRight size={14} className={`transform transition-transform ${showResources ? 'rotate-90' : ''}`} />
            </button>

            <AnimatePresence>
              {showResources && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute top-10 left-1/2 -translate-x-1/2 w-48 bg-card dark:bg-slate-800 rounded-xl elev-3 border border-ink-100 dark:border-slate-700 py-2 flex flex-col z-50 overflow-hidden text-sm font-medium"
                >
                  <Link href="/about" onClick={() => setShowResources(false)} className="px-5 py-2.5 hover:bg-ink-50 dark:hover:bg-slate-700/50 hover:text-primary transition-colors">About</Link>
                  <Link href="/blog" onClick={() => setShowResources(false)} className="px-5 py-2.5 hover:bg-ink-50 dark:hover:bg-slate-700/50 hover:text-primary transition-colors">Blog</Link>
                  <Link href="/support" onClick={() => setShowResources(false)} className="px-5 py-2.5 hover:bg-ink-50 dark:hover:bg-slate-700/50 hover:text-primary transition-colors">Support</Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="w-px h-6 bg-ink-200 hidden md:block" />

          {user ? (
            <div className="flex items-center gap-6">
              <Link href="/search" className="focus-ring text-sm font-bold text-primary px-4 py-2 bg-primary-50 rounded-md hover:bg-primary-100 transition-colors">
                DOI
              </Link>
              {/* Notification Bell */}
              <NotificationBell />
              <div className="flex items-center gap-4 border-l border-ink-200 pl-6">
                <Link href={`/profile/${user.id}`} className="text-sm font-semibold text-ink-700 hover:text-primary transition-colors">
                  {user.name}
                </Link>
                <button
                  onClick={logout}
                  className="focus-ring rounded-md text-sm font-medium text-ink-500 hover:text-secondary transition-colors"
                >
                  Sign out
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className="btn btn-ghost">
                Log in
              </Link>
              <Link href="/register" className="btn btn-primary rounded-full">
                Join the Lab
              </Link>
            </div>
          )}
        </div>
      </nav>
    </>
  );
}
