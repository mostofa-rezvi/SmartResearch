"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  Search, Users, BookOpen, Compass, MessageSquare, ChevronRight, X, Menu,
  LayoutDashboard, Library as LibraryIcon, Sparkles, Users2, FolderGit2,
  GraduationCap, Bell, User as UserIcon, ShieldCheck, LogOut, FileText, KanbanSquare,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { NotificationBell } from "@/components/NotificationBell";
import ThemeToggle from "@/components/ThemeToggle";
import { SearchBar } from "@/components/search-bar";

/* ─────────────────────────── Authenticated app shell ─────────────────────── */

type NavItem = { href: string; label: string; icon: React.ComponentType<{ size?: number; className?: string }> };
type NavSection = { title: string; items: NavItem[] };

function useNavSections(userId?: string, isAdmin?: boolean): NavSection[] {
  const sections: NavSection[] = [
    {
      title: "Workspace",
      items: [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/library", label: "Library", icon: LibraryIcon },
        { href: "/discovery", label: "Discovery", icon: Compass },
        { href: "/assistant", label: "AI Assistant", icon: Sparkles },
      ],
    },
    {
      title: "Collaborate",
      items: [
        { href: "/researchers", label: "Researchers", icon: Users },
        { href: "/teams", label: "Teams", icon: FolderGit2 },
        { href: "/workspace", label: "Workspace", icon: KanbanSquare },
        { href: "/groups", label: "Groups", icon: Users2 },
        { href: "/community", label: "Community", icon: MessageSquare },
        { href: "/mentorship", label: "Mentorship", icon: GraduationCap },
      ],
    },
    {
      title: "Account",
      items: [
        { href: "/notifications", label: "Notifications", icon: Bell },
        { href: userId ? `/profile/${userId}` : "/dashboard", label: "Profile", icon: UserIcon },
      ],
    },
  ];
  if (isAdmin) {
    sections.push({
      title: "Administration",
      items: [{ href: "/admin/dashboard", label: "Admin", icon: ShieldCheck }],
    });
  }
  return sections;
}

function SidebarContent({
  sections,
  pathname,
  user,
  onNavigate,
}: {
  sections: NavSection[];
  pathname: string;
  user: NonNullable<ReturnType<typeof useAuth>["user"]>;
  onNavigate?: () => void;
}) {
  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);
  const roleLabel = user.role === "super_admin" || user.role === "admin" ? "Administrator" : "Researcher";

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center gap-2.5 px-5 border-b border-[color:var(--color-border)] shrink-0">
        <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-[color:var(--color-border)] flex items-center justify-center p-1">
          <img src="/logo-icon.png" alt="" className="w-6 h-6 object-contain" />
        </div>
        <span className="text-lg font-serif font-black tracking-tight text-primary dark:text-white">ResearchBridge</span>
      </div>

      {/* User card */}
      <Link
        href={`/profile/${user.id}`}
        onClick={onNavigate}
        className="mx-3 mt-3 flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-ink-50 transition-colors"
      >
        <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm shrink-0">
          {user.name?.[0]?.toUpperCase() || "?"}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-ink-900 truncate">{user.name}</p>
          <p className="text-[11px] font-semibold text-ink-400">{roleLabel}</p>
        </div>
      </Link>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto custom-scrollbar px-3 py-4 space-y-6">
        {sections.map((section) => (
          <div key={section.title}>
            <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-ink-400">{section.title}</p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                      active
                        ? "bg-primary/10 dark:bg-white/10 text-primary dark:text-white"
                        : "text-ink-600 hover:bg-ink-50 hover:text-ink-900"
                    }`}
                  >
                    <Icon size={18} className="shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </div>
  );
}

function AppShell({ user, logout }: { user: NonNullable<ReturnType<typeof useAuth>["user"]>; logout: () => void }) {
  const pathname = usePathname();
  const { isAdmin } = useAuth();
  const sections = useNavSections(user.id, isAdmin);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close the mobile drawer on route change.
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  // Offset page content right of the fixed sidebar (desktop) — see globals.css.
  useEffect(() => {
    document.body.classList.add("has-app-shell");
    return () => document.body.classList.remove("has-app-shell");
  }, []);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:block fixed inset-y-0 left-0 w-64 z-40 bg-card border-r border-[color:var(--color-border)]">
        <SidebarContent sections={sections} pathname={pathname} user={user} />
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="lg:hidden fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.2 }}
              className="lg:hidden fixed inset-y-0 left-0 w-64 z-50 bg-card border-r border-[color:var(--color-border)]"
            >
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="absolute top-4 right-3 p-1.5 rounded-md text-ink-400 hover:bg-ink-100 z-10"
              >
                <X size={18} />
              </button>
              <SidebarContent sections={sections} pathname={pathname} user={user} onNavigate={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Top action bar */}
      <header className="fixed top-0 right-0 left-0 lg:left-64 z-30 h-16 glass-morphism flex items-center gap-3 px-4 md:px-6">
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          className="lg:hidden p-2 rounded-md text-ink-600 hover:bg-ink-100"
        >
          <Menu size={20} />
        </button>

        {/* Global search with autocomplete + paper previews */}
        <SearchBar variant="nav" placeholder="Search papers, researchers, DOI…" />

        <div className="flex items-center gap-1.5 ml-auto">
          {/* DOI lookup */}
          <Link
            href="/search"
            title="DOI lookup"
            className="hidden sm:flex items-center gap-1.5 h-9 px-3 rounded-lg bg-primary/10 text-primary dark:text-white text-sm font-bold hover:bg-primary/20 transition-colors"
          >
            <FileText size={15} /> DOI
          </Link>
          <ThemeToggle />
          <NotificationBell />
          <div className="w-px h-6 bg-[color:var(--color-border)] mx-1 hidden sm:block" />
          <Link
            href={`/profile/${user.id}`}
            className="hidden sm:flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-ink-50 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs">
              {user.name?.[0]?.toUpperCase() || "?"}
            </div>
            <span className="text-sm font-semibold text-ink-800 max-w-[120px] truncate">{user.name}</span>
          </Link>
          <button
            onClick={logout}
            aria-label="Sign out"
            className="p-2 rounded-md text-ink-500 hover:text-secondary hover:bg-ink-100 transition-colors"
            title="Sign out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>
    </>
  );
}

/* ─────────────────────────── Marketing top nav (logged out) ──────────────── */

function MarketingNav() {
  const [showResources, setShowResources] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setShowResources(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-morphism h-16 flex items-center px-6 md:px-12 justify-between">
      <Link href="/" className="flex items-center gap-3 group">
        <div className="relative w-9 h-9 flex items-center justify-center p-1 rounded-lg bg-white dark:bg-slate-800 border border-[color:var(--color-border)]">
          <img src="/logo-icon.png" alt="ResearchBridge Logo" className="w-7 h-7 object-contain" />
        </div>
        <span className="text-xl font-serif font-black tracking-tight text-primary dark:text-white">ResearchBridge</span>
      </Link>

      <div className="flex items-center gap-6">
        <div className="hidden md:flex items-center gap-6 text-[15px] font-medium text-ink-500 relative" ref={dropdownRef}>
          <button
            onClick={() => setShowResources(!showResources)}
            aria-expanded={showResources}
            className="focus-ring flex items-center gap-1 rounded-md px-1 py-0.5 hover:text-primary transition-colors"
          >
            Resources <ChevronRight size={14} className={`transform transition-transform ${showResources ? "rotate-90" : ""}`} />
          </button>
          <AnimatePresence>
            {showResources && (
              <motion.div
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                className="absolute top-9 left-1/2 -translate-x-1/2 w-44 bg-card rounded-lg border border-[color:var(--color-border)] elev-2 py-1.5 flex flex-col z-50 text-sm font-medium"
              >
                <Link href="/about" onClick={() => setShowResources(false)} className="px-4 py-2 hover:bg-ink-50 hover:text-primary transition-colors">About</Link>
                <Link href="/blog" onClick={() => setShowResources(false)} className="px-4 py-2 hover:bg-ink-50 hover:text-primary transition-colors">Blog</Link>
                <Link href="/support" onClick={() => setShowResources(false)} className="px-4 py-2 hover:bg-ink-50 hover:text-primary transition-colors">Support</Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <ThemeToggle />

        <div className="flex items-center gap-2">
          <Link href="/login" className="btn btn-ghost">Log in</Link>
          <Link href="/register" className="btn btn-primary">Join the Lab</Link>
        </div>
      </div>
    </nav>
  );
}

/* ─────────────────────────────── Entry point ─────────────────────────────── */

export default function Navbar() {
  const { user, logout } = useAuth();
  if (user) return <AppShell user={user} logout={logout} />;
  return <MarketingNav />;
}
