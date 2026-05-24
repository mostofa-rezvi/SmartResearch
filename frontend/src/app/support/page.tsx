"use client";

import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { 
  Search, Mail, MessageCircle, FileText, 
  HelpCircle, ChevronDown, X, Send, CheckCircle2,
  PhoneCall, ShieldCheck, Sparkles
} from "lucide-react";

const faqs = [
  { q: "How do I verify my institutional status?", a: "Go to your Profile Settings > Verification and upload a copy of your staff/student ID or use your institutional email address. Verification typically takes 1-2 business days." },
  { q: "What is an Impact Score?", a: "Impact Score is a real-time metric based on how many researchers saved your papers, replied to your discussions, and cited your verified data. It represents your active influence in the community." },
  { q: "How can I create a private Lab Group?", a: "Private groups are available for professional and institutional accounts. Click 'Create Group' in the Groups Hub, select 'Private', and invite your specific collaborators." },
  { q: "Are my unpublished drafts secure?", a: "Absolutely. All drafts and private documents are end-to-end encrypted. They will never be shared, indexed, or analyzed without your explicit publication consent." }
];

export default function SupportPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ticketState, setTicketState] = useState<'idle' | 'sending' | 'sent'>('idle');

  const handleTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTicketState('sending');
    setTimeout(() => {
      setTicketState('sent');
      setTimeout(() => {
        setIsModalOpen(false);
        setTicketState('idle');
      }, 3000);
    }, 1500);
  };

  // Stagger variants
  const containerVars: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVars: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] dark:bg-[#0A0A0B] selection:bg-[#B49A6E]/30 selection:text-[#5A4D37] dark:selection:text-[#E8DCC4]">
      <Navbar />
      
      <main className="pt-32 pb-24 px-6 overflow-hidden">
        <div className="max-w-5xl mx-auto">
          
          {/* Header Section */}
          <motion.header 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="mb-16 text-center relative"
          >
            {/* Subtle glow effect behind text */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#B49A6E]/10 dark:bg-[#B49A6E]/5 blur-3xl rounded-full pointer-events-none" />
            
            <h1 className="text-5xl md:text-6xl font-serif font-black text-[#2A2A2B] dark:text-[#F3F1EC] mb-6 tracking-tight relative z-10">
               Support <motion.span 
                 animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                 transition={{ duration: 5, ease: "linear", repeat: Infinity }}
                 className="text-transparent bg-clip-text bg-gradient-to-r from-[#B49A6E] via-[#8C754E] to-[#B49A6E] bg-[length:200%_auto] italic pr-2"
               >
                 Concierge
               </motion.span>
            </h1>
            <p className="text-[#6B6B6D] dark:text-[#8E8E91] text-lg max-w-xl mx-auto font-medium">
              Premium assistance for your research journey. Find answers, connect with specialists, or explore our knowledge base.
            </p>
          </motion.header>

          {/* Search Bar */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="relative mb-24 max-w-2xl mx-auto group"
          >
            <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-[#8C754E] group-focus-within:text-[#B49A6E] transition-colors">
              <Search size={22} />
            </div>
            <input 
              type="text" 
              placeholder="Search premium articles (e.g. 'verification', 'billing')..."
              className="w-full pl-16 pr-6 py-5 rounded-3xl bg-white dark:bg-[#121213] border-2 border-[#EAE7E0] dark:border-[#222224] shadow-lg shadow-[#B49A6E]/5 text-[#2A2A2B] dark:text-[#F3F1EC] placeholder:text-[#A0A0A3] focus:border-[#B49A6E] dark:focus:border-[#8C754E] focus:shadow-xl focus:shadow-[#B49A6E]/10 focus:scale-[1.02] outline-none transition-all duration-300"
            />
          </motion.div>

          {/* Cards Grid */}
          <motion.div 
            variants={containerVars}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-32"
          >
            {/* Email Support */}
            <motion.div variants={itemVars} className="p-8 rounded-[32px] bg-white dark:bg-[#121213] border border-[#EAE7E0] dark:border-[#222224] shadow-xl shadow-black/[0.02] text-center group hover:-translate-y-1 transition-all duration-300 flex flex-col items-center">
                <div className="w-16 h-16 bg-[#F8F6F2] dark:bg-[#1A1A1B] rounded-2xl flex items-center justify-center text-[#B49A6E] mb-6 group-hover:scale-110 group-hover:bg-[#B49A6E] group-hover:text-white transition-all duration-300 shadow-inner">
                    <Mail size={24} />
                </div>
                <h3 className="text-xl font-serif font-bold text-[#2A2A2B] dark:text-[#F3F1EC] mb-2">Priority Inbox</h3>
                <p className="text-sm text-[#8E8E91] mb-8 px-4">Direct access to our specialized support team. Expected response within 4 hours.</p>
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="mt-auto px-6 py-2.5 rounded-full bg-[#F8F6F2] dark:bg-[#1A1A1B] text-[#8C754E] font-bold text-sm group-hover:bg-[#B49A6E] group-hover:text-white transition-all duration-300"
                >
                  Send Ticket
                </button>
            </motion.div>
            
            {/* Live Chat */}
            <motion.div variants={itemVars} className="p-8 rounded-[32px] bg-white dark:bg-[#121213] border border-[#EAE7E0] dark:border-[#222224] shadow-xl shadow-black/[0.02] text-center group hover:-translate-y-1 transition-all duration-300 flex flex-col items-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#B49A6E]/10 to-transparent rounded-bl-full pointer-events-none" />
                <div className="w-16 h-16 bg-[#F8F6F2] dark:bg-[#1A1A1B] rounded-2xl flex items-center justify-center text-[#8C754E] mb-6 group-hover:scale-110 group-hover:bg-[#8C754E] group-hover:text-white transition-all duration-300 shadow-inner">
                    <MessageCircle size={24} />
                </div>
                <h3 className="text-xl font-serif font-bold text-[#2A2A2B] dark:text-[#F3F1EC] mb-2">Live Concierge</h3>
                <p className="text-sm text-[#8E8E91] mb-8 px-4">Real-time chat with a research success manager. Available 9am-6pm EST.</p>
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="mt-auto px-6 py-2.5 rounded-full bg-[#F8F6F2] dark:bg-[#1A1A1B] text-[#8C754E] font-bold text-sm group-hover:bg-[#8C754E] group-hover:text-white transition-all duration-300 flex items-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Start Chat
                </button>
            </motion.div>

            {/* Knowledge Base */}
            <motion.div variants={itemVars} className="p-8 rounded-[32px] bg-white dark:bg-[#121213] border border-[#EAE7E0] dark:border-[#222224] shadow-xl shadow-black/[0.02] text-center group hover:-translate-y-1 transition-all duration-300 flex flex-col items-center">
                <div className="w-16 h-16 bg-[#F8F6F2] dark:bg-[#1A1A1B] rounded-2xl flex items-center justify-center text-[#9E8B6D] mb-6 group-hover:scale-110 group-hover:bg-[#9E8B6D] group-hover:text-white transition-all duration-300 shadow-inner">
                    <FileText size={24} />
                </div>
                <h3 className="text-xl font-serif font-bold text-[#2A2A2B] dark:text-[#F3F1EC] mb-2">The Archive</h3>
                <p className="text-sm text-[#8E8E91] mb-8 px-4">Comprehensive, meticulously maintained guides and API documentation.</p>
                <button className="mt-auto px-6 py-2.5 rounded-full bg-[#F8F6F2] dark:bg-[#1A1A1B] text-[#9E8B6D] font-bold text-sm group-hover:bg-[#9E8B6D] group-hover:text-white transition-all duration-300">
                  Read Guides
                </button>
            </motion.div>
          </motion.div>

          {/* Interactive FAQ Section */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="bg-white dark:bg-[#121213] p-10 md:p-14 rounded-[40px] border border-[#EAE7E0] dark:border-[#222224] shadow-2xl shadow-[#B49A6E]/5"
          >
            <div className="flex flex-col md:flex-row gap-12">
              <div className="md:w-1/3">
                <h2 className="text-3xl font-serif font-black text-[#2A2A2B] dark:text-[#F3F1EC] mb-4 flex items-center gap-3">
                    <ShieldCheck className="text-[#B49A6E]" size={28} /> Common Inquiries
                </h2>
                <p className="text-[#8E8E91] leading-relaxed mb-6">
                  Carefully curated answers to the questions we receive most frequently from our premium members.
                </p>
                <div className="hidden md:block p-6 rounded-2xl bg-[#F8F6F2] dark:bg-[#1A1A1B] border border-[#EAE7E0] dark:border-[#222224]">
                  <p className="text-sm font-semibold text-[#6B6B6D] dark:text-[#8E8E91] mb-2">Need more specific help?</p>
                  <p className="text-xs text-[#A0A0A3] mb-4">Our concierge team is available via priority inbox.</p>
                  <button 
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 text-sm font-bold text-[#B49A6E] hover:text-[#8C754E] transition-colors"
                  >
                    Open a ticket &rarr;
                  </button>
                </div>
              </div>

              <div className="md:w-2/3 space-y-4">
                {faqs.map((faq, i) => {
                  const isOpen = openFaq === i;
                  return (
                    <div 
                      key={i} 
                      className={`overflow-hidden rounded-2xl border transition-all duration-300 ${
                        isOpen 
                          ? 'border-[#B49A6E]/30 bg-[#B49A6E]/[0.02] dark:bg-[#B49A6E]/[0.05]' 
                          : 'border-[#EAE7E0] dark:border-[#222224] bg-transparent hover:border-[#B49A6E]/20'
                      }`}
                    >
                      <button 
                        onClick={() => setOpenFaq(isOpen ? null : i)}
                        className="w-full flex items-center justify-between p-6 text-left"
                      >
                        <h4 className={`font-bold text-lg transition-colors duration-300 pr-8 ${
                          isOpen ? 'text-[#B49A6E]' : 'text-[#2A2A2B] dark:text-[#F3F1EC]'
                        }`}>
                          {faq.q}
                        </h4>
                        <motion.div
                          animate={{ rotate: isOpen ? 180 : 0 }}
                          transition={{ type: "spring", stiffness: 300, damping: 24 }}
                          className={`shrink-0 ${isOpen ? 'text-[#B49A6E]' : 'text-[#A0A0A3]'}`}
                        >
                          <ChevronDown size={20} />
                        </motion.div>
                      </button>
                      
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                          >
                            <div className="px-6 pb-6 text-[#6B6B6D] dark:text-[#8E8E91] leading-relaxed">
                              {faq.a}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />

      {/* Ticket Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => ticketState === 'idle' && setIsModalOpen(false)}
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="relative w-full max-w-lg bg-white dark:bg-[#121213] rounded-[32px] border border-[#EAE7E0] dark:border-[#222224] shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="px-8 py-6 border-b border-[#EAE7E0] dark:border-[#222224] flex items-center justify-between bg-[#FDFCFB] dark:bg-[#0A0A0B]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#B49A6E]/10 flex items-center justify-center text-[#B49A6E]">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-[#2A2A2B] dark:text-[#F3F1EC] text-lg">Priority Support</h3>
                    <p className="text-xs font-semibold text-[#8E8E91] uppercase tracking-wider">Submit a Ticket</p>
                  </div>
                </div>
                {ticketState === 'idle' && (
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="p-2 text-[#A0A0A3] hover:text-[#2A2A2B] dark:hover:text-[#F3F1EC] bg-white dark:bg-[#1A1A1B] rounded-full border border-[#EAE7E0] dark:border-[#222224] transition-all"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Modal Body */}
              <div className="p-8">
                {ticketState === 'sent' ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center text-center py-8"
                  >
                    <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 mb-6">
                      <CheckCircle2 size={40} />
                    </div>
                    <h4 className="text-2xl font-serif font-bold text-[#2A2A2B] dark:text-[#F3F1EC] mb-2">Ticket Submitted</h4>
                    <p className="text-[#8E8E91]">Your priority request has been routed to our concierge team. We will be in touch shortly.</p>
                  </motion.div>
                ) : (
                  <form onSubmit={handleTicketSubmit} className="space-y-6">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#6B6B6D] dark:text-[#8E8E91] mb-2">
                        Category
                      </label>
                      <select className="w-full px-4 py-3.5 rounded-xl bg-[#F8F6F2] dark:bg-[#1A1A1B] border border-[#EAE7E0] dark:border-[#222224] text-[#2A2A2B] dark:text-[#F3F1EC] focus:border-[#B49A6E] focus:ring-2 focus:ring-[#B49A6E]/20 outline-none transition-all appearance-none font-medium">
                        <option>Account Verification</option>
                        <option>Billing & Subscription</option>
                        <option>Data Privacy & Security</option>
                        <option>Technical Issue</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#6B6B6D] dark:text-[#8E8E91] mb-2">
                        Subject
                      </label>
                      <input 
                        required
                        type="text" 
                        placeholder="Brief summary of your request"
                        className="w-full px-4 py-3.5 rounded-xl bg-[#F8F6F2] dark:bg-[#1A1A1B] border border-[#EAE7E0] dark:border-[#222224] text-[#2A2A2B] dark:text-[#F3F1EC] placeholder:text-[#A0A0A3] focus:border-[#B49A6E] focus:ring-2 focus:ring-[#B49A6E]/20 outline-none transition-all font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#6B6B6D] dark:text-[#8E8E91] mb-2">
                        Message details
                      </label>
                      <textarea 
                        required
                        placeholder="Please provide any relevant details..."
                        rows={4}
                        className="w-full px-4 py-3.5 rounded-xl bg-[#F8F6F2] dark:bg-[#1A1A1B] border border-[#EAE7E0] dark:border-[#222224] text-[#2A2A2B] dark:text-[#F3F1EC] placeholder:text-[#A0A0A3] focus:border-[#B49A6E] focus:ring-2 focus:ring-[#B49A6E]/20 outline-none transition-all font-medium resize-none"
                      />
                    </div>

                    <button 
                      disabled={ticketState === 'sending'}
                      type="submit"
                      className="w-full py-4 rounded-xl bg-[#2A2A2B] dark:bg-[#F3F1EC] text-white dark:text-[#121213] font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-70 disabled:hover:translate-y-0 flex items-center justify-center gap-2"
                    >
                      {ticketState === 'sending' ? (
                        <div className="w-5 h-5 border-2 border-white/30 dark:border-black/30 border-t-white dark:border-t-black rounded-full animate-spin" />
                      ) : (
                        <>Submit Ticket <Send size={16} /></>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
