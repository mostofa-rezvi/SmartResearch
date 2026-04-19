"use client";

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Search, Users, BookOpen, Compass, MessageSquare } from 'lucide-react';

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-morphism h-16 flex items-center px-6 md:px-12 justify-between">
      <div className="flex items-center gap-2 text-primary">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold">R</div>
        <Link href="/">
          <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">ResearchBridge</span>
        </Link>
      </div>
      
      {/* Full Research Lifecycle Navigation (mission.md) */}
      <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
        {user && (
          <>
            <Link href="/discovery" className="hover:text-primary transition-colors flex items-center gap-1">
              <Compass size={15} /> Discovery
            </Link>
            <Link href="/community" className="hover:text-primary transition-colors flex items-center gap-1">
              <MessageSquare size={15} /> Community
            </Link>
            <Link href="/groups" className="hover:text-primary transition-colors flex items-center gap-1">
              <Users size={15} /> Groups
            </Link>
            <Link href="/library" className="hover:text-primary transition-colors flex items-center gap-1">
              <BookOpen size={15} /> Library
            </Link>
          </>
        )}
        {isAdmin && (
          <Link href="/admin/dashboard" className="text-accent hover:text-accent/80 font-bold transition-colors">
            Admin Panel
          </Link>
        )}
      </div>

      <div className="flex items-center gap-4">
        {user ? (
          <>
            <Link href={`/profile/${user.id}`} className="text-sm font-medium text-slate-600 dark:text-slate-300 hidden sm:inline hover:text-primary transition-colors cursor-pointer">
              Hello, {user.name}
            </Link>
            <button 
              onClick={logout}
              className="text-sm font-medium text-red-500 hover:text-red-600 transition-colors"
            >
              Log out
            </button>
          </>
        ) : (
          <>
            <Link href="/login" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary transition-colors">
              Log in
            </Link>
            <Link 
              href="/register" 
              className="bg-primary text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-secondary transition-all shadow-lg hover:shadow-primary/25"
            >
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
