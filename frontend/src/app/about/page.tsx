"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import Image from "next/image";


export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#020617]">
      <Navbar />
      
      <main className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Mission Section */}
          <section className="mb-32">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-4xl mx-auto mb-20"
            >
              <h1 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white mb-8">
                Democratizing <br />
                <span className="text-primary italic">Global Intelligence</span>
              </h1>
              <p className="text-xl text-slate-600 dark:text-slate-400 leading-relaxed">
                ResearchBridge was founded in 2026 with a single goal: to accelerate human 
                progress by removing the frictions of scientific collaboration. We believe 
                that the next great breakthrough shouldn't be delayed by a paywall or 
                a lack of connection.
              </p>
            </motion.div>

            <div className="relative aspect-[21/9] rounded-[48px] overflow-hidden border-8 border-slate-50 dark:border-white/5 shadow-2xl">
              <Image 
                src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=2000" 
                alt="Our Lab" 
                fill 
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
              <div className="absolute bottom-12 left-12">
                <p className="text-white text-2xl font-bold">Bridging discovery and breakthrough.</p>
              </div>
            </div>
          </section>

          {/* Stats Section */}
          <section className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-32">
            {[
              { label: "Researchers", value: "50k+" },
              { label: "Papers Shared", value: "1.2M" },
              { label: "Countries", value: "140+" },
              { label: "Citations Tracked", value: "25M" }
            ].map((stat, i) => (
              <div key={i} className="text-center p-8 rounded-3xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10">
                <div className="text-4xl font-black text-primary mb-2">{stat.value}</div>
                <div className="text-sm font-bold text-slate-500 uppercase tracking-widest">{stat.label}</div>
              </div>
            ))}
          </section>

          {/* Values Section */}
          <section className="mb-32">
             <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">Our Core Values</h2>
              <div className="w-20 h-1.5 bg-primary mx-auto rounded-full" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { title: "Radical Transparency", desc: "Open data, open methods, open results. We believe transparency is the foundation of trust in science." },
                { title: "Velocity Over Friction", desc: "Every tool we build is designed to make research faster and more seamless, removing administrative hurdles." },
                { title: "Verified Integrity", desc: "Using cutting-edge technology to ensure that every claim on our platform is backed by immutable data." }
              ].map((v, i) => (
                <div key={i} className="p-10 rounded-3xl bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 hover:shadow-xl transition-all">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">{v.title}</h3>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{v.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Team Preview */}
          <section className="text-center mb-20">
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">The Team Behind the Bridge</h2>
            <p className="text-slate-500 max-w-2xl mx-auto mb-16">A diverse group of scientists, engineers, and designers working to change the world.</p>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { name: "Dr. Elena Rossi", role: "CEO & Founder", image: "https://i.pravatar.cc/300?u=elena" },
                { name: "Marcus Thorne", role: "CTO", image: "https://i.pravatar.cc/300?u=marcus" },
                { name: "Satoshi Tanaka", role: "Head of AI", image: "https://i.pravatar.cc/300?u=satoshi" },
                { name: "Sarah Jenkins", role: "Lead Designer", image: "https://i.pravatar.cc/300?u=sarah" }
              ].map((m, i) => (
                <div key={i} className="group">
                  <div className="relative aspect-square rounded-2xl overflow-hidden mb-4 border border-slate-100 dark:border-white/10">
                     <Image src={m.image} alt={m.name} fill className="object-cover transition-transform duration-500 group-hover:scale-110" />
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white">{m.name}</h4>
                  <p className="text-sm text-slate-500">{m.role}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
