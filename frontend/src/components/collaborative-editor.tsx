"use client";

import React, { useEffect, useState } from "react";
import { Bold, Italic, Heading1, Heading2, List, Wifi, WifiOff } from "lucide-react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import { useYjs } from "../hooks/useYjs";

export function CollaborativeEditorInner() {
  const { doc, provider, awareness, status, activeUsers } = useYjs();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Collaboration.configure({
        document: doc,
      }),
      CollaborationCursor.configure({
        provider: provider,
        user: awareness.getLocalState()?.user || { name: 'Anonymous', color: '#ffcc00' },
      }),
    ],
    content: "Start writing your methodology here...",
  });

  if (!isMounted) return null;

  return (
    <div className="bg-white dark:bg-[#0F172A] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-[700px] overflow-hidden">
      
      {/* Editor Toolbar */}
      <div className="flex items-center gap-2 p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
        <button 
          onClick={() => editor?.chain().focus().toggleBold().run()}
          className={`p-2 rounded-lg transition-colors ${editor?.isActive('bold') ? 'bg-slate-200 dark:bg-slate-800 text-blue-600 dark:text-blue-400' : 'hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'}`}
        >
          <Bold size={18} />
        </button>
        <button 
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          className={`p-2 rounded-lg transition-colors ${editor?.isActive('italic') ? 'bg-slate-200 dark:bg-slate-800 text-blue-600 dark:text-blue-400' : 'hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'}`}
        >
          <Italic size={18} />
        </button>
        <div className="w-px h-6 bg-slate-300 dark:bg-slate-700 mx-2" />
        <button 
          onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`p-2 rounded-lg transition-colors ${editor?.isActive('heading', { level: 1 }) ? 'bg-slate-200 dark:bg-slate-800 text-blue-600 dark:text-blue-400' : 'hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'}`}
        >
          <Heading1 size={18} />
        </button>
        <button 
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-2 rounded-lg transition-colors ${editor?.isActive('heading', { level: 2 }) ? 'bg-slate-200 dark:bg-slate-800 text-blue-600 dark:text-blue-400' : 'hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'}`}
        >
          <Heading2 size={18} />
        </button>
        <div className="w-px h-6 bg-slate-300 dark:bg-slate-700 mx-2" />
        <button 
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded-lg transition-colors ${editor?.isActive('bulletList') ? 'bg-slate-200 dark:bg-slate-800 text-blue-600 dark:text-blue-400' : 'hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'}`}
        >
          <List size={18} />
        </button>

        <div className="flex-1" />
        
        {/* Active Users */}
        <div className="flex items-center gap-2 mr-4">
          {activeUsers.map((user) => (
            user.user && (
              <div 
                key={user.clientId} 
                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
                style={{ backgroundColor: user.user.color }}
                title={user.user.name}
              >
                {user.user.name.charAt(0).toUpperCase()}
              </div>
            )
          ))}
        </div>

        {/* Connection Status */}
        <div className="flex items-center gap-1.5 text-xs font-medium">
          {status === 'connected' ? (
            <span className="flex items-center gap-1 text-emerald-500"><Wifi size={14} /> Synced</span>
          ) : (
            <span className="flex items-center gap-1 text-amber-500"><WifiOff size={14} /> {status === 'connecting' ? 'Reconnecting...' : 'Offline'}</span>
          )}
        </div>
      </div>

      {/* Editor Surface */}
      <div className="flex-1 p-8 overflow-y-auto relative cursor-text prose prose-slate dark:prose-invert max-w-none">
        <EditorContent 
          editor={editor} 
          className="w-full h-full outline-none [&>.tiptap]:h-full [&>.tiptap]:outline-none"
        />
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        /* Tiptap Collaboration Cursor Styles */
        .collaboration-cursor__caret {
          border-left: 2px solid #0D0D0D;
          border-right: 2px solid #0D0D0D;
          margin-left: -2px;
          margin-right: -2px;
          pointer-events: none;
          position: relative;
          word-break: normal;
        }

        .collaboration-cursor__label {
          border-radius: 3px 3px 3px 0;
          color: #fff;
          font-size: 12px;
          font-style: normal;
          font-weight: 600;
          left: -2px;
          line-height: normal;
          padding: 2px 6px;
          position: absolute;
          top: -1.8em;
          user-select: none;
          white-space: nowrap;
          z-index: 10;
        }
      `}} />
    </div>
  );
}

// We need to export a component wrapped in the YjsProvider
import { YjsProvider } from "../context/YjsProvider";

export function CollaborativeEditor({ documentId = "default-doc" }: { documentId?: string }) {
  return (
    <YjsProvider documentId={documentId}>
      <CollaborativeEditorInner />
    </YjsProvider>
  );
}
