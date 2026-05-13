"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, Edit3, Type, Sigma, List, Image as ImageIcon, Send } from "lucide-react";

interface CommunityEditorProps {
  placeholder?: string;
  onSave?: (content: string) => void;
  onChange?: (content: string) => void;
  initialValue?: string;
  submitLabel?: string;
  hideFooter?: boolean;
}

import { API } from "@/config/api";
import { useAuth } from "@/context/AuthContext";

export const CommunityEditor: React.FC<CommunityEditorProps> = ({ 
  placeholder = "Share your insights... Use $..$ for inline math and $$..$$ for blocks.",
  onSave,
  onChange,
  initialValue = "",
  submitLabel = "Post Answer",
  hideFooter = false
}) => {
  const [content, setContent] = useState(initialValue);
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { token } = useAuth();

  const handleChange = (val: string) => {
    setContent(val);
    if (onChange) onChange(val);
  };

  const handleSave = () => {
    if (onSave) onSave(content);
    setContent("");
    setMode("edit");
  };

  const insertMarkdown = (prefix: string, suffix: string = "") => {
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const before = text.substring(0, start);
    const selection = text.substring(start, end);
    const after = text.substring(end);

    const newText = before + prefix + (selection || "text") + suffix + after;
    handleChange(newText);
    
    // Reset focus and selection
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + (selection.length || 4));
    }, 0);
  };

  const handleAddImage = () => {
    // Open file selector instead of prompt
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch(API.community.upload, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });

      const result = await response.json();
      if (result.success) {
        insertMarkdown(`![${file.name}](${result.data.url})`, "");
      }
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-2xl overflow-hidden flex flex-col">
      {/* Editor Toolbar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setMode("edit")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${mode === "edit" ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
          >
            <Edit3 size={16} /> Edit
          </button>
          <button 
            onClick={() => setMode("preview")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${mode === "preview" ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
          >
            <Eye size={16} /> Preview
          </button>
        </div>

        <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
           <button 
             onClick={() => insertMarkdown("**", "**")}
             className="p-2 text-slate-500 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all" 
             title="Bold"
           >
             <span className="font-bold text-sm">B</span>
           </button>
           <button 
             onClick={() => insertMarkdown("*", "*")}
             className="p-2 text-slate-500 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all" 
             title="Italic"
           >
             <span className="italic text-sm font-serif">I</span>
           </button>
           <button 
             onClick={() => insertMarkdown("\n- ", "")}
             className="p-2 text-slate-500 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all" 
             title="List"
           >
             <List size={18} />
           </button>
           <button 
             onClick={() => insertMarkdown("$$", "$$")}
             className="p-2 text-slate-500 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all" 
             title="Math Block"
           >
             <Sigma size={18} />
           </button>
           <button 
             onClick={handleAddImage}
             disabled={isUploading}
             className="p-2 text-slate-500 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all disabled:opacity-50" 
             title="Insert Image"
           >
             {isUploading ? (
               <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
             ) : (
               <ImageIcon size={18} />
             )}
           </button>

           <input 
             type="file"
             ref={fileInputRef}
             className="hidden"
             accept="image/*"
             onChange={handleFileChange}
           />
        </div>

        <div className="hidden md:flex items-center gap-4 text-slate-400">
           <div className="flex items-center gap-1.5" title="Markdown Supported">
              <Type size={14} /> <span className="text-[10px] font-bold uppercase">Markdown</span>
           </div>
        </div>
      </div>

      {/* Editor Content Area */}
      <div className="relative min-h-[300px] flex flex-col">
        <AnimatePresence mode="wait">
          {mode === "edit" ? (
            <motion.textarea
              key="edit"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              value={content}
              onChange={(e) => handleChange(e.target.value)}
              placeholder={placeholder}
              className="w-full h-full min-h-[300px] p-8 bg-transparent outline-none resize-none text-slate-800 dark:text-slate-200 font-serif text-lg leading-relaxed"
            />
          ) : (
            <motion.div
              key="preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full min-h-[300px] p-8 prose dark:prose-invert max-w-none overflow-y-auto"
            >
              {content ? (
                <ReactMarkdown 
                  remarkPlugins={[remarkMath]} 
                  rehypePlugins={[rehypeKatex]}
                >
                  {content}
                </ReactMarkdown>
              ) : (
                <span className="text-slate-400 italic">Nothing to preview yet...</span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Actions */}
      {!hideFooter && (
        <div className="px-6 py-4 border-t border-slate-50 dark:border-slate-900 flex items-center justify-end">
          <button 
            onClick={handleSave}
            disabled={!content.trim()}
            className="flex items-center gap-2 px-8 py-3 bg-primary text-white rounded-2xl font-bold shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 disabled:shadow-none"
          >
            {submitLabel} <Send size={18} />
          </button>
        </div>
      )}

    </div>
  );
};
