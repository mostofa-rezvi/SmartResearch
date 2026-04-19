"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Search, Users, BookOpen, Compass, MessageSquare, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-morphism h-20 flex items-center px-6 md:px-12 justify-between">
      <div className="flex items-center gap-8">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform duration-300">
            RB
          </div>
          <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300">
            ResearchBridge
          </span>
        </Link>

        {/* Public Navigation */}
        <div className="hidden lg:flex items-center gap-8 text-[15px] font-medium text-slate-600 dark:text-slate-400">
          <Link href="/features" className="hover:text-primary transition-colors">Features</Link>
          <Link href="/pricing" className="hover:text-primary transition-colors">Pricing</Link>
          <Link href="/about" className="hover:text-primary transition-colors">About</Link>
          <Link href="/contact" className="hover:text-primary transition-colors">Contact</Link>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {user ? (
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-6 text-[15px] font-medium border-r border-slate-200 dark:border-slate-800 pr-6">
              <Link href="/discovery" className="hover:text-primary transition-colors flex items-center gap-1.5">
                <Compass size={18} /> Discovery
              </Link>
              <Link href="/community" className="hover:text-primary transition-colors flex items-center gap-1.5">
                <MessageSquare size={18} /> Community
              </Link>
            </div>
            
            <div className="flex items-center gap-4">
              <Link href={`/profile/${user.id}`} className="text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-primary transition-colors">
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
          <div className="flex items-center gap-3">
            <Link href="/login" className="px-5 py-2.5 text-[15px] font-semibold text-slate-700 dark:text-slate-200 hover:text-primary transition-colors">
              Log in
            </Link>
            <Link 
              href="/register" 
              className="bg-primary text-white px-6 py-2.5 rounded-full text-[15px] font-bold hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 hover:shadow-primary/30 active:scale-95"
            >
              Get Started
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
