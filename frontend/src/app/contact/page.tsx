"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";

import { Mail, MessageSquare, MapPin, Phone, Send } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#020617]">
      <Navbar />
      
      <main className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-16 lg:gap-24">
            
            {/* Left Side: Contact Info */}
            <div className="flex-1">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <h1 className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white mb-8">
                  Let's Connect <br />
                  <span className="text-primary">Globally</span>
                </h1>
                <p className="text-xl text-slate-600 dark:text-slate-400 mb-12 leading-relaxed">
                  Have questions about our platform or want to bring ResearchBridge to your university? 
                  Our team is here to help you accelerate your research.
                </p>

                <div className="space-y-8">
                  {[
                    { icon: <Mail className="text-primary" />, title: "Support", text: "support@researchbridge.org" },
                    { icon: <MessageSquare className="text-accent" />, title: "Sales", text: "sales@researchbridge.org" },
                    { icon: <MapPin className="text-red-500" />, title: "Headquarters", text: "123 Innovation Way, Tech Valley, CA" },
                    { icon: <Phone className="text-emerald-500" />, title: "Phone", text: "+1 (555) 123-4567" }
                  ].map((item, i) => (
                    <div key={i} className="flex gap-6 items-start group">
                      <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                        {item.icon}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white mb-1">{item.title}</h4>
                        <p className="text-slate-500 dark:text-slate-400">{item.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Right Side: Contact Form */}
            <div className="flex-1">
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-8 md:p-12 rounded-[40px] bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 shadow-2xl"
              >
                <form className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Full Name</label>
                       <input 
                        type="text" 
                        placeholder="Dr. Jane Doe"
                        className="w-full px-6 py-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none" 
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Email Address</label>
                       <input 
                        type="email" 
                        placeholder="jane@university.edu"
                        className="w-full px-6 py-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none" 
                       />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Subject</label>
                    <select className="w-full px-6 py-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none appearance-none">
                      <option>General Inquiry</option>
                      <option>Sales & Partnerships</option>
                      <option>Academic Integration</option>
                      <option>Support & Feedback</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Message</label>
                    <textarea 
                      rows={5}
                      placeholder="How can we help you?"
                      className="w-full px-6 py-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none resize-none"
                    />
                  </div>

                  <button className="w-full bg-primary text-white py-5 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 active:scale-95">
                    Send Message
                    <Send size={20} />
                  </button>
                </form>
              </motion.div>
            </div>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
