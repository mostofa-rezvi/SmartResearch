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
            className="fixed bottom-6 right-6 z-[100] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-primary/20 p-5 max-w-sm"
          >
            <button
              onClick={() => setShowOnboardingPrompt(false)}
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              <X size={16} />
            </button>
            <h3 className="font-bold text-slate-900 dark:text-white mb-2 pr-6">Complete Your Profile</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Get personalized research recommendations and connect with peers by completing your onboarding!
            </p>
            <Link
              href="/onboarding"
              onClick={() => setShowOnboardingPrompt(false)}
              className="block text-center w-full bg-primary text-white py-2 rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
            >
              Finish Onboarding
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
            <div className="hidden lg:flex items-center gap-8 text-[15px] font-bold text-slate-600">
              <Link href="/library" className="hover:text-primary transition-colors">Library</Link>
              <Link href="/discovery" className="hover:text-primary transition-colors">Discovery</Link>
              <Link href="/researchers" className="hover:text-primary transition-colors">Researchers</Link>
              <Link href="/community" className="hover:text-primary transition-colors">Community</Link>
              <Link href="/groups" className="hover:text-primary transition-colors">Groups</Link>
            </div>
          )}
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-6 text-[15px] font-medium text-slate-500 relative" ref={dropdownRef}>
            <button
              onClick={() => setShowResources(!showResources)}
              className="flex items-center gap-1 hover:text-primary transition-colors focus:outline-none"
            >
              Resources <ChevronRight size={14} className={`transform transition-transform ${showResources ? 'rotate-90' : ''}`} />
            </button>

            <AnimatePresence>
              {showResources && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute top-10 left-1/2 -translate-x-1/2 w-48 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 py-2 flex flex-col z-50 overflow-hidden"
                >
                  <Link href="/about" onClick={() => setShowResources(false)} className="px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-primary transition-colors">About</Link>
                  <Link href="/blog" onClick={() => setShowResources(false)} className="px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-primary transition-colors">Blog</Link>
                  <Link href="/support" onClick={() => setShowResources(false)} className="px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-primary transition-colors">Support</Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="w-px h-6 bg-slate-200 hidden md:block" />

          {user ? (
            <div className="flex items-center gap-6">
              <Link href="/search" className="text-sm font-bold text-primary px-4 py-2 bg-primary/5 rounded-lg hover:bg-primary/10 transition-colors">
                DOI
              </Link>
              {/* Notification Bell */}
              <NotificationBell />
              <div className="flex items-center gap-4 border-l border-slate-200 pl-6">
                <Link href={`/profile/${user.id}`} className="text-sm font-semibold text-slate-700 hover:text-primary transition-colors">
                  {user.name}
                </Link>
                <button
                  onClick={logout}
                  className="text-sm font-medium text-slate-500 hover:text-red-500 transition-colors"
                >
                  Sign out
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className="px-5 py-2.5 text-[15px] font-bold text-slate-700 hover:text-primary transition-colors">
                Login
              </Link>
              <Link
                href="/register"
                className="bg-[#0D9488] text-white px-6 py-2.5 rounded-full text-[15px] font-bold hover:bg-[#0D9488]/90 transition-all shadow-xl shadow-teal-500/20 active:scale-95"
              >
                Join the Lab
              </Link>
            </div>
          )}
        </div>
      </nav>
    </>
  );
}
