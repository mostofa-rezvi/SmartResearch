"use client";

import Navbar from "@/components/Navbar";
import { motion } from "framer-motion";
import { CheckCircle2, HelpCircle, Zap } from "lucide-react";
import { useState } from "react";

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  const plans = [
    {
      name: "Free",
      price: billingCycle === "monthly" ? "0" : "0",
      description: "Perfect for students and early-career researchers.",
      features: [
        "Up to 5 active projects",
        "Public lab space access",
        "Standard semantic search",
        "1GB secure storage",
        "Community support"
      ],
      cta: "Start for Free",
      popular: false
    },
    {
      name: "Professional",
      price: billingCycle === "monthly" ? "29" : "24",
      description: "Advanced tools for professional researchers and PhDs.",
      features: [
        "Unlimited active projects",
        "Private lab spaces",
        "AI Research Assistant",
        "Advanced citation tools",
        "100GB secure storage",
        "Priority email support",
        "Blockchain verification"
      ],
      cta: "Get Started",
      popular: true
    },
    {
      name: "Institutional",
      price: "Custom",
      description: "Enterprise features for universities and research labs.",
      features: [
        "Everything in Professional",
        "Unlimited storage",
        "SSO & Admin controls",
        "API access for automation",
        "Dedicated account manager",
        "On-premise deployment option",
        "Custom legal agreements"
      ],
      cta: "Contact Sales",
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-[#020617]">
      <Navbar />
      
      <main className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h1 className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white mb-6">
              Simple Pricing for <br />
              <span className="text-primary">Breakthrough Research</span>
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-xl max-w-2xl mx-auto mb-12">
              Choose the plan that fits your research speed. No hidden fees, cancel anytime.
            </p>

            {/* Billing Cycle Toggle */}
            <div className="flex items-center justify-center gap-4">
              <span className={`text-sm font-bold ${billingCycle === "monthly" ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>Monthly</span>
              <button 
                onClick={() => setBillingCycle(billingCycle === "monthly" ? "yearly" : "monthly")}
                className="w-14 h-8 bg-slate-200 dark:bg-white/10 rounded-full p-1 transition-all flex items-center"
              >
                <div className={`w-6 h-6 bg-primary rounded-full shadow-lg transform transition-transform ${billingCycle === "yearly" ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-bold ${billingCycle === "yearly" ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>Yearly</span>
                <span className="text-[10px] font-black bg-emerald-500 text-white px-2 py-0.5 rounded-full">SAVE 20%</span>
              </div>
            </div>
          </motion.div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-32">
            {plans.map((p, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`p-10 rounded-[40px] border ${p.popular ? 'border-primary ring-4 ring-primary/5 bg-primary/5 scale-105 relative z-10' : 'border-slate-100 dark:border-white/10 bg-white dark:bg-white/5'} flex flex-col`}
              >
                {p.popular && <span className="absolute -top-5 left-1/2 -translate-x-1/2 bg-primary text-white px-6 py-1.5 rounded-full text-xs font-black tracking-widest uppercase">Best Value</span>}
                <div className="mb-8">
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{p.name}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{p.description}</p>
                </div>
                
                <div className="mb-10">
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-black text-slate-900 dark:text-white">
                      {p.price !== "Custom" && "$"}
                      {p.price}
                    </span>
                    {p.price !== "Custom" && <span className="text-slate-500 text-sm font-medium">/mo</span>}
                  </div>
                  {billingCycle === "yearly" && p.price !== "Custom" && p.price !== "0" && (
                    <p className="text-xs text-emerald-500 font-bold mt-2">Billed annually (${parseInt(p.price) * 12}/yr)</p>
                  )}
                </div>

                <ul className="space-y-5 mb-12 flex-grow">
                  {p.features.map((f, fi) => (
                    <li key={fi} className="flex items-start gap-3 text-slate-700 dark:text-slate-300">
                      <CheckCircle2 size={20} className="text-primary shrink-0 opacity-80" />
                      <span className="text-[15px]">{f}</span>
                    </li>
                  ))}
                </ul>

                <button className={`w-full py-5 rounded-2xl font-bold transition-all ${p.popular ? 'bg-primary text-white hover:bg-primary/90 shadow-2xl shadow-primary/30' : 'bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-white/20 active:scale-95'}`}>
                  {p.cta}
                </button>
              </motion.div>
            ))}
          </div>

          {/* FAQ Preview */}
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white text-center mb-12">Frequently Asked Questions</h2>
            <div className="space-y-6">
              {[
                { q: "Can I switch plans later?", a: "Yes, you can upgrade or downgrade your plan at any time from your account settings." },
                { q: "Is there a student discount?", a: "The Free plan is designed specifically for students, but we also offer 50% off for verified academic faculty." },
                { q: "What happens if I run out of storage?", a: "You'll receive a notification when you reach 90% capacity. You can upgrade or delete old data to free up space." }
              ].map((faq, i) => (
                <div key={i} className="p-6 rounded-2xl border border-slate-100 dark:border-white/10">
                  <h4 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                    <HelpCircle size={18} className="text-primary" />
                    {faq.q}
                  </h4>
                  <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <footer className="py-20 border-t border-slate-100 dark:border-white/5 text-center text-slate-500 text-sm">
        <p>© 2026 ResearchBridge. All rights reserved.</p>
      </footer>
    </div>
  );
}
