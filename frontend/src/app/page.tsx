"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  ArrowRight,
  Search,
  Users,
  Lightbulb,
  ShieldCheck,
  Globe,
  Zap,
  Quote
} from "lucide-react";

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user && !user.onboarding_completed) {
      router.push("/onboarding");
    }
  }, [user, isLoading, router]);

  if (isLoading || (user && !user.onboarding_completed)) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="italic text-slate-500 animate-pulse">Initializing research universe...</p>
        </div>
      </div>
    );
  }

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  };

  const stagger = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#020617] overflow-x-hidden selection:bg-primary/20">
      <Navbar />

      <main className="pt-20">
        {/* Hero Section */}
        <section className="relative px-6 pt-20 pb-24 md:pt-32 md:pb-40 overflow-hidden">
          {/* Background Elements */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -z-10 w-full max-w-7xl h-full opacity-30 dark:opacity-20 bg-grid pointer-events-none" />
          <div className="absolute top-[-10%] right-[-10%] -z-10 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] left-[-10%] -z-10 w-[500px] h-[500px] bg-accent/20 rounded-full blur-[120px]" />

          <div className="max-w-7xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary/10 border border-secondary/20 text-secondary text-sm font-bold mb-8 uppercase tracking-wider mono-academic"
            >
              <Users size={14} className="fill-secondary" />
              <span>Bridging Academic Isolation</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight text-slate-900 dark:text-white mb-8 leading-[1.1] font-serif"
            >
              From Curiosity to <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-secondary via-accent to-secondary animate-gradient-x">
                Contribution.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="text-lg md:text-2xl text-slate-600 dark:text-slate-400 max-w-4xl mx-auto mb-12 leading-relaxed font-light"
            >
              Your Unified Research Home. Escaping the isolation of traditional academia with
              structured, intelligent, and human-centered discovery.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="flex flex-col sm:flex-row justify-center gap-5"
            >
              <Link href="/register" className="group bg-primary text-white px-8 py-4 rounded-2xl text-lg font-bold hover:bg-primary/90 transition-all shadow-2xl shadow-primary/25 flex items-center justify-center gap-2">
                Start Your Journey
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/accept-invite" className="bg-white dark:bg-white/5 text-slate-900 dark:text-white px-8 py-4 rounded-2xl text-lg font-bold border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 transition-all flex items-center justify-center gap-2 shadow-sm">
                <Users size={20} className="text-secondary" />
                Accept Invitation
              </Link>
            </motion.div>

            {/* Dashboard Mockup Preview */}
            <motion.div
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.5 }}
              className="mt-24 relative max-w-5xl mx-auto group"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/30 to-accent/30 rounded-3xl blur-3xl -z-10 opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="relative rounded-3xl overflow-hidden border border-slate-200 dark:border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] dark:shadow-none">
                <Image
                  src="/hero.png"
                  alt="ResearchBridge Dashboard"
                  width={1200}
                  height={675}
                  className="w-full h-auto object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent" />
              </div>
            </motion.div>
          </div>
        </section>

        {/* Trust Section */}
        <section className="py-16 bg-slate-50 dark:bg-white/[0.02] border-y border-slate-100 dark:border-white/5">
          <div className="max-w-7xl mx-auto px-6">
            <p className="text-center text-sm font-semibold text-slate-500 uppercase tracking-widest mb-10">
              Trusted by Researchers from World-Class Institutions
            </p>
            <div className="flex flex-wrap justify-center items-center gap-12 md:gap-20 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
              {/* Placeholders for logos */}
              {["MIT", "Stanford", "CERN", "Oxford", "Harvard"].map((name) => (
                <span key={name} className="text-2xl font-black text-slate-400 dark:text-slate-600">{name}</span>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-32 px-6 max-w-7xl mx-auto" id="features">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">Built for Modern Science</h2>
            <p className="text-slate-600 dark:text-slate-400 text-lg max-w-2xl mx-auto">
              Everything you need to accelerate your research workflow, from initial hypothesis to final publication.
            </p>
          </div>

          <motion.div
            variants={stagger}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {[
              { icon: <Search className="text-primary" />, title: "Semantic Discovery", desc: "Find exactly what you need with our AI-powered semantic search that understands context, not just keywords." },
              { icon: <Users className="text-blue-500" />, title: "Team Collaboration", desc: "Real-time shared workspaces for labs and remote teams. Track progress, share datasets, and co-write papers." },
              { icon: <Zap className="text-amber-500" />, title: "Instant Citations", desc: "Automated citation management that supports thousands of styles. Focus on writing, not formatting." },
              { icon: <ShieldCheck className="text-emerald-500" />, title: "Verify & Secure", desc: "Blockchain-backed version control for your data ensuring integrity and clear lineage of your breakthroughs." },
              { icon: <Globe className="text-indigo-500" />, title: "Global Network", desc: "Connect with experts in your niche. Peer review, mentorship, and networking redefined for the digital age." },
              { icon: <Lightbulb className="text-accent" />, title: "Smart Insights", desc: "Receive automated summaries and trend analysis in your field. Stay ahead of the curve without the noise." }
            ].map((f, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                className="group p-8 rounded-3xl bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1"
              >
                <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  {f.icon}
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">{f.title}</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* How It Works */}
        <section className="py-32 px-6 bg-slate-900 text-white rounded-[40px] md:rounded-[60px] mx-4 md:mx-8 mb-32 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] -z-0" />

          <div className="relative z-10 max-w-7xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">How It Works</h2>
              <p className="text-slate-400 text-lg max-w-2xl mx-auto">Start your journey to breakthrough in minutes.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-8">
              {[
                { step: "01", title: "Join the Network", desc: "Create your researcher profile and specify your areas of expertise and interest." },
                { step: "02", title: "Discover & Connect", desc: "Use our discovery tools to find relevant papers, datasets, and potential collaborators." },
                { step: "03", title: "Collaborate & Publish", desc: "Build groups, share insights, and get your work verified and published to the world." }
              ].map((s, i) => (
                <div key={i} className="relative flex flex-col items-center text-center">
                  <div className="text-8xl font-black text-white/5 absolute -top-12 left-1/2 -translate-x-1/2 select-none">{s.step}</div>
                  <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-2xl font-bold mb-8 shadow-xl shadow-primary/40 relative z-10">
                    {i + 1}
                  </div>
                  <h3 className="text-2xl font-bold mb-4">{s.title}</h3>
                  <p className="text-slate-400">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-32 px-6 max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">What Pioneers Say</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { name: "Dr. Sarah Chen", role: "Biotech Researcher", text: "ResearchBridge changed how our lab operates. The ability to share live datasets and get instant peer feedback is revolutionary." },
              { name: "Prof. James Wilson", role: "Physics Lead, CERN", text: "The cleanest interface I've seen in academia. It actually makes the administrative side of research enjoyable." },
              { name: "Alex Rivera", role: "PhD Candidate", text: "Finding collaborators for cross-disciplinary studies used to take months. Now it takes a few clicks." }
            ].map((t, i) => (
              <div key={i} className="p-8 rounded-3xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 relative">
                <Quote className="text-primary/20 absolute top-8 right-8" size={48} />
                <p className="text-lg text-slate-700 dark:text-slate-300 italic mb-8 relative z-10">"{t.text}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600" />
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">{t.name}</h4>
                    <p className="text-sm text-slate-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing Preview */}
        <section className="py-32 px-6 max-w-7xl mx-auto" id="pricing">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">Simple, Transparent Pricing</h2>
            <p className="text-slate-600 dark:text-slate-400 text-lg">Scales with your research needs.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { name: "Individual", price: "0", features: ["Up to 5 Projects", "Community Access", "Standard Search", "Basic Storage"] },
              { name: "Professional", price: "29", popular: true, features: ["Unlimited Projects", "AI Research Assistant", "Semantic Search", "100GB Storage", "Priority Support"] },
              { name: "Institutional", price: "Custom", features: ["Everything in Pro", "Single Sign-On (SSO)", "Admin Controls", "API Access", "Dedicated Manager"] }
            ].map((p, i) => (
              <div key={i} className={`p-8 rounded-[32px] border ${p.popular ? 'border-primary ring-4 ring-primary/10 bg-primary/5 scale-105' : 'border-slate-100 dark:border-white/10 bg-white dark:bg-white/5'} flex flex-col relative`}>
                {p.popular && <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white px-4 py-1 rounded-full text-xs font-bold">MOST POPULAR</span>}
                <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">{p.name}</h3>
                <div className="mb-6">
                  <span className="text-4xl font-black text-slate-900 dark:text-white">${p.price}</span>
                  {p.price !== "Custom" && <span className="text-slate-500 text-sm">/mo</span>}
                </div>
                <ul className="space-y-4 mb-8 flex-grow">
                  {p.features.map((f, fi) => (
                    <li key={fi} className="flex items-center gap-3 text-slate-600 dark:text-slate-400 text-sm">
                      <CheckCircle2 size={18} className="text-primary shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button className={`w-full py-4 rounded-xl font-bold transition-all ${p.popular ? 'bg-primary text-white hover:bg-primary/90 shadow-xl shadow-primary/20' : 'bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-white/20'}`}>
                  {p.price === "Custom" ? "Contact Sales" : "Get Started"}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA Banner */}
        <section className="py-24 px-6 max-w-7xl mx-auto">
          <div className="relative bg-primary rounded-[48px] p-12 md:p-24 text-center overflow-hidden">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/10 rounded-full blur-[100px]" />
            <div className="relative z-10 max-w-3xl mx-auto">
              <h2 className="text-4xl md:text-6xl font-black text-white mb-8">Ready to Accelerate Your Research?</h2>
              <p className="text-white/80 text-lg md:text-xl mb-12">
                Join 50,000+ researchers making breakthroughs every day with ResearchBridge.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link href="/register" className="bg-white text-primary px-10 py-4 rounded-2xl text-lg font-bold hover:bg-slate-100 transition-all shadow-2xl overflow-hidden group">
                  Create Free Account
                </Link>
                <Link href="/contact" className="bg-primary-700/50 backdrop-blur-md text-white border border-white/20 px-10 py-4 rounded-2xl text-lg font-bold hover:bg-primary-700/70 transition-all">
                  Contact Sales
                </Link>
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </main>
    </div>
  );
}
