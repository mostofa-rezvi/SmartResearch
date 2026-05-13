"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MessageSquare, Lightbulb, Tag, Sparkles } from "lucide-react";
import { CommunityEditor } from "./CommunityEditor";

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newPost: any) => void;
  token: string;
  apiUrl: string;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({ isOpen, onClose, onSuccess, token, apiUrl }) => {
  const [type, setType] = useState<'question' | 'thought'>('question');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleSubmit = async () => {
    if (content.length < 10) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          type,
          title: type === 'question' ? title : '',
          content,
          tags
        })
      });

      const result = await response.json();
      if (result.success) {
        onSuccess(result.data);
        onClose();
        // Reset
        setTitle('');
        setContent('');
        setTags([]);
      }
    } catch (err) {
      console.error("Failed to create post:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
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
          className="relative bg-white dark:bg-slate-800 w-full max-w-3xl rounded-[2.5rem] shadow-2xl border border-white/10 overflow-hidden"
        >
          <div className="flex items-center justify-between p-8 border-b border-slate-50 dark:border-slate-700">
            <div>
               <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                 <Sparkles className="text-primary" /> Share Knowledge
               </h2>
               <p className="text-sm text-slate-500 mt-1">Contribute to the global researcher community.</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
              <X size={24} className="text-slate-400" />
            </button>
          </div>

          <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Type Selector */}
            <div className="flex gap-4">
              <button 
                onClick={() => setType('question')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border-2 transition-all ${type === 'question' ? 'border-primary bg-primary/5 text-primary font-bold' : 'border-slate-100 dark:border-slate-700 text-slate-400'}`}
              >
                <MessageSquare size={18} /> Question
              </button>
              <button 
                onClick={() => setType('thought')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border-2 transition-all ${type === 'thought' ? 'border-primary bg-primary/5 text-primary font-bold' : 'border-slate-100 dark:border-slate-700 text-slate-400'}`}
              >
                <Lightbulb size={18} /> Open Thought
              </button>
            </div>

            {/* Title (for questions) */}
            {type === 'question' && (
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-2 uppercase tracking-wider">Question Title</label>
                <input 
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. How to optimize RAG for medical datasets?"
                  className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 focus:ring-2 focus:ring-primary outline-none transition-all"
                />
              </div>
            )}

            {/* Editor */}
            <div className="space-y-2">
               <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-2 uppercase tracking-wider">Content</label>
               <CommunityEditor 
                 placeholder={type === 'question' ? "Explain your question in detail... use LaTeX for math!" : "Share your latest research insight..."}
                 onChange={(val) => setContent(val)}
                 initialValue={content}
                 hideFooter={true}
               />
            </div>

            {/* Tags */}
            <div className="space-y-3">
               <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-2 uppercase tracking-wider">Tags</label>
               <div className="flex flex-wrap gap-2 mb-2">
                 {tags.map(tag => (
                   <span key={tag} className="flex items-center gap-1 px-3 py-1 bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 rounded-full text-xs font-bold border border-slate-200 dark:border-slate-700">
                     {tag} <X size={12} className="cursor-pointer hover:text-rose-500" onClick={() => handleRemoveTag(tag)} />
                   </span>
                 ))}
               </div>
               <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                      placeholder="Add field (e.g. Physics, AI)"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 outline-none"
                    />
                  </div>
                  <button 
                    onClick={handleAddTag}
                    className="px-6 py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-sm hover:bg-slate-200"
                  >
                    Add
                  </button>
               </div>
            </div>
          </div>

          <div className="p-8 border-t border-slate-50 dark:border-slate-700 flex justify-end gap-4">
            <button 
              onClick={onClose}
              className="px-8 py-3 rounded-2xl text-slate-500 font-bold hover:bg-slate-50 dark:hover:bg-slate-900 transition-all"
            >
              Cancel
            </button>
            <button 
              onClick={handleSubmit}
              disabled={isSubmitting || content.length < 10}
              className="px-10 py-3 bg-primary text-white rounded-2xl font-bold shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
            >
              {isSubmitting ? 'Posting...' : 'Post to Community'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
