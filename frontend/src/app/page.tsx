"use client";

import Navbar from "@/components/Navbar";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user && !user.onboarding_completed) {
      router.push("/onboarding");
    }
  }, [user, isLoading, router]);

  if (isLoading || (user && !user.onboarding_completed)) {
    return <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center italic text-slate-400">Loading your research universe...</div>;
  }
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 overflow-x-hidden">
      <Navbar />
      
      <main>
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 md:px-12 max-w-7xl mx-auto flex flex-col items-center text-center">
          <div className="absolute top-0 right-0 -z-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 -z-10 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
            A Hub for the Global <br />
            <span className="text-primary italic">Research Community</span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-3xl mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom-10 delay-200 duration-700">
            ResearchBridge is a unified digital platform built to empower scholars, 
            undergraduates, and professors to discover breakthroughs, collaborate on 
            innovations, and share knowledge that changes the world.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 animate-in fade-in slide-in-from-bottom-12 delay-400 duration-700">
            <button className="bg-primary text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-secondary transition-all shadow-xl hover:shadow-primary/30 flex items-center gap-2 group">
              Get Started
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 group-hover:translate-x-1 transition-transform">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </button>
            <button className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-8 py-4 rounded-xl text-lg font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-all">
              Explore Research
            </button>
          </div>

          {/* Hero Image / Mockup */}
          <div className="mt-20 relative w-full aspect-video md:aspect-[21/9] rounded-2xl overflow-hidden shadow-2xl border-4 border-white dark:border-slate-800 animate-in fade-in zoom-in delay-600 duration-1000">
            <Image 
              src="/hero.png" 
              alt="ResearchBridge Platform" 
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </div>
        </section>

        {/* Value Propositions */}
        <section className="py-20 px-6 md:px-12 max-w-7xl mx-auto" id="features">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="p-8 rounded-2xl bg-white dark:bg-slate-800 shadow-lg border border-slate-100 dark:border-slate-700 hover:-translate-y-2 transition-transform">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">Smart Discovery</h3>
              <p className="text-slate-600 dark:text-slate-400">
                Advanced semantic search and personalized recommendations to find relevant papers and collaborators instantly.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-white dark:bg-slate-800 shadow-lg border border-slate-100 dark:border-slate-700 hover:-translate-y-2 transition-transform">
              <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center text-accent mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">Seamless Collaboration</h3>
              <p className="text-slate-600 dark:text-slate-400">
                Connect with researchers worldwide. Build teams, share datasets, and co-author publications from anywhere.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-white dark:bg-slate-800 shadow-lg border border-slate-100 dark:border-slate-700 hover:-translate-y-2 transition-transform">
              <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center text-secondary mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75Z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">Open Knowledge</h3>
              <p className="text-slate-600 dark:text-slate-400">
                A home for research at every stage. We bridge the gap between amateur curiosity and professional expertise.
              </p>
            </div>
          </div>
        </section>

        {/* Personalized Recommendations Section */}
        {user && (
          <section className="py-20 px-6 md:px-12 max-w-7xl mx-auto border-t border-slate-200 dark:border-slate-800">
            <h2 className="text-3xl font-bold mb-8 text-slate-900 dark:text-white">
              Recommended for {user.researcher_type === 'new_researcher' ? 'Early Discovery' : 'Advanced Analysis'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                  <div className="h-32 bg-primary/5 rounded-lg mb-4 flex items-center justify-center text-primary/20">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  </div>
                  <h4 className="font-bold mb-1 text-slate-900 dark:text-white line-clamp-2">The Future of ResearchBridge: A Study on {item}</h4>
                  <p className="text-xs text-slate-500 mb-2">Dec 2026 • 12 Citations</p>
                  <button className="text-primary text-xs font-bold hover:underline">Read Abstract →</button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="py-12 border-t border-slate-200 dark:border-slate-800 text-center text-sm text-slate-500">
          <p>© 2026 ResearchBridge. All rights reserved.</p>
        </footer>
      </main>
    </div>
  );
}
