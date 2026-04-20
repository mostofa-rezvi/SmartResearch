"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { Briefcase, MapPin, Zap, Globe } from "lucide-react";

export default function CareersPage() {
  const jobs = [
    { title: "Senior AI Research Engineer", location: "Remote / CA", type: "Full-time" },
    { title: "Scientific UX Designer", location: "London / Remote", type: "Full-time" },
    { title: "Backend Systems Architect", location: "New York", type: "Full-time" },
    { title: "Academic Outreach Lead", location: "Global", type: "Contract" }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-[#020617]">
      <Navbar />
      
      <main className="pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto">
          <header className="mb-20 text-center">
            <h1 className="text-5xl md:text-7xl font-serif font-black text-primary dark:text-white mb-6">
              Join the <span className="text-secondary italic">Movement</span>
            </h1>
            <p className="text-slate-500 text-xl font-medium max-w-2xl mx-auto">
              "We're looking for the minds that will build the next century of scientific discovery."
            </p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-24">
             <div className="p-10 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/5">
                <Globe className="text-primary mb-6" size={32} />
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Remote-First Culture</h3>
                <p className="text-slate-500 leading-relaxed">Collaborate from anywhere in the world. We value deep work and async communication over office presence.</p>
             </div>
             <div className="p-10 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/5">
                <Zap className="text-secondary mb-6" size={32} />
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Research Credits</h3>
                <p className="text-slate-500 leading-relaxed">Every employee gets a monthly budget to support open-access research projects of their choice.</p>
             </div>
          </div>

          <div className="space-y-6">
             <h2 className="text-2xl font-serif font-black text-slate-900 dark:text-white mb-8 border-b border-slate-100 dark:border-white/5 pb-4">Open Positions</h2>
             {jobs.map((job, i) => (
                <div key={i} className="flex flex-col md:flex-row justify-between items-center p-8 rounded-2xl border border-slate-100 dark:border-white/5 hover:border-primary transition-all group cursor-pointer">
                   <div>
                      <h4 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">{job.title}</h4>
                      <div className="flex gap-4 mt-2 text-sm text-slate-400 font-medium tracking-tight">
                         <span className="flex items-center gap-1"><MapPin size={14} /> {job.location}</span>
                         <span className="flex items-center gap-1"><Briefcase size={14} /> {job.type}</span>
                      </div>
                   </div>
                   <button className="mt-6 md:mt-0 px-6 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold hover:bg-primary hover:text-white transition-all">Apply Now</button>
                </div>
             ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
