"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, Check, MessageCircle, Send, Globe } from "lucide-react";

// Custom SVG Icons for brands (Lucide sometimes lacks these in specific versions)
const FacebookIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
);
const TwitterIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
);
const LinkedinIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
);

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, url, title }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOptions = [
    {
      name: "WhatsApp",
      icon: <MessageCircle className="text-emerald-500" />,
      color: "hover:bg-emerald-50",
      href: `https://wa.me/?text=${encodeURIComponent(title + " " + url)}`
    },
    {
      name: "Messenger",
      icon: <Send className="text-blue-500" />,
      color: "hover:bg-blue-50",
      href: `fb-messenger://share/?link=${encodeURIComponent(url)}`
    },
    {
      name: "Facebook",
      icon: <FacebookIcon />,
      color: "hover:bg-blue-50 text-blue-600",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
    },
    {
      name: "Twitter",
      icon: <TwitterIcon />,
      color: "hover:bg-sky-50 text-sky-500",
      href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`
    },
    {
      name: "LinkedIn",
      icon: <LinkedinIcon />,
      color: "hover:bg-indigo-50 text-indigo-600",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
    }
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden"
        >
          <div className="p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Share Insight</h3>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
              >
                <X size={20} className="text-slate-500" />
              </button>
            </div>

            <div className="grid grid-cols-5 gap-4 mb-10">
              {shareOptions.map((option) => (
                <a
                  key={option.name}
                  href={option.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all ${option.color} group`}
                >
                  <div className="w-12 h-12 flex items-center justify-center bg-white dark:bg-slate-700 rounded-2xl shadow-sm group-hover:scale-110 transition-transform">
                    {option.icon}
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tighter">
                    {option.name}
                  </span>
                </a>
              ))}
            </div>

            <div className="space-y-3">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Copy Link</p>
              <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700">
                <input 
                  type="text" 
                  readOnly 
                  value={url}
                  className="flex-1 bg-transparent border-none outline-none px-3 text-sm text-slate-600 dark:text-slate-300 font-mono"
                />
                <button 
                  onClick={handleCopy}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${copied ? "bg-emerald-500 text-white" : "bg-primary text-white shadow-lg shadow-primary/20 hover:scale-105"}`}
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>
          </div>
          
          <div className="px-8 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800">
             <p className="text-[10px] text-slate-400 text-center font-medium">
               Help spread research insights to the global community.
             </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
