import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-morphism h-16 flex items-center px-6 md:px-12 justify-between">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold">R</div>
        <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">ResearchBridge</span>
      </div>
      
      <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-300">
        <Link href="#features" className="hover:text-primary transition-colors">Features</Link>
        <Link href="#community" className="hover:text-primary transition-colors">Community</Link>
        <Link href="#about" className="hover:text-primary transition-colors">About</Link>
      </div>

      <div className="flex items-center gap-4">
        <Link href="/login" className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary transition-colors">
          Log in
        </Link>
        <Link 
          href="/register" 
          className="bg-primary text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-secondary transition-all shadow-lg hover:shadow-primary/25"
        >
          Register
        </Link>
      </div>
    </nav>
  );
}
