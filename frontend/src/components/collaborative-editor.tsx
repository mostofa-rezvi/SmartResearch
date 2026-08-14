"use client";

import React from "react";
import {
  Bold, Italic, Underline, Strikethrough, Code, Code2,
  Heading1, Heading2, Heading3, List, ListOrdered, Quote, Link2, Minus,
  Wifi, WifiOff, Loader2,
} from "lucide-react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import { useYjs } from "../hooks/useYjs";
import { YjsProvider } from "../context/YjsProvider";

/** Compact toolbar button — keeps editor selection on click (mousedown preventDefault). */
function ToolBtn({
  onClick, active, disabled, title, children,
}: {
  onClick: () => void; active?: boolean; disabled?: boolean; title: string; children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`p-2 rounded-md transition-colors disabled:opacity-40 ${
        active ? "bg-primary/10 text-primary dark:bg-white/10 dark:text-white" : "text-ink-600 hover:bg-ink-100"
      }`}
    >
      {children}
    </button>
  );
}

function ToolDivider() {
  return <div className="w-px h-6 bg-[color:var(--color-border)] mx-1" />;
}

/**
 * The actual editing surface. This component is only rendered once the Yjs
 * `provider` exists, so `useEditor` never configures CollaborationCursor with a
 * null provider (which crashes TipTap's plugin setup on `provider.awareness`).
 */
function EditorSurface({
  doc,
  status,
  activeUsers,
}: {
  doc: any;
  status: string;
  activeUsers: any[];
}) {
  const editor = useEditor(
    {
      immediatelyRender: false,
      // Real-time co-editing via the shared Yjs document. (We intentionally omit
      // the separate collaboration-cursor extension: the installed
      // extension-collaboration-cursor@3.0 is version-skewed with
      // extension-collaboration@3.26 and crashes on the ySyncPlugin lookup.
      // Live presence is still shown via the awareness avatars in the toolbar.)
      extensions: [StarterKit, Collaboration.configure({ document: doc })],
    },
    [doc]
  );

  // Insert / edit a link — for DOIs, references, and external sources.
  const setLink = () => {
    if (!editor) return;
    const prev = (editor.getAttributes("link").href as string) || "";
    const url = window.prompt("Link URL (DOI, reference, website)", prev || "https://");
    if (url === null) return; // cancelled
    if (url.trim() === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  };

  return (
    <div className="bg-card rounded-xl border border-[color:var(--color-border)] shadow-sm flex flex-col h-[700px] overflow-hidden">
      {/* Editor Toolbar — research-report formatting */}
      <div className="flex flex-wrap items-center gap-0.5 p-2 border-b border-[color:var(--color-border)] bg-ink-50">
        {/* Text styles */}
        <ToolBtn title="Bold (Ctrl+B)" active={editor?.isActive("bold")} onClick={() => editor?.chain().focus().toggleBold().run()}><Bold size={17} /></ToolBtn>
        <ToolBtn title="Italic (Ctrl+I)" active={editor?.isActive("italic")} onClick={() => editor?.chain().focus().toggleItalic().run()}><Italic size={17} /></ToolBtn>
        <ToolBtn title="Underline (Ctrl+U)" active={editor?.isActive("underline")} onClick={() => editor?.chain().focus().toggleUnderline().run()}><Underline size={17} /></ToolBtn>
        <ToolBtn title="Strikethrough" active={editor?.isActive("strike")} onClick={() => editor?.chain().focus().toggleStrike().run()}><Strikethrough size={17} /></ToolBtn>
        <ToolBtn title="Inline code" active={editor?.isActive("code")} onClick={() => editor?.chain().focus().toggleCode().run()}><Code size={17} /></ToolBtn>

        <ToolDivider />

        {/* Headings / structure */}
        <ToolBtn title="Heading 1" active={editor?.isActive("heading", { level: 1 })} onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}><Heading1 size={17} /></ToolBtn>
        <ToolBtn title="Heading 2" active={editor?.isActive("heading", { level: 2 })} onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 size={17} /></ToolBtn>
        <ToolBtn title="Heading 3" active={editor?.isActive("heading", { level: 3 })} onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 size={17} /></ToolBtn>

        <ToolDivider />

        {/* Lists & blocks */}
        <ToolBtn title="Bullet list" active={editor?.isActive("bulletList")} onClick={() => editor?.chain().focus().toggleBulletList().run()}><List size={17} /></ToolBtn>
        <ToolBtn title="Numbered list" active={editor?.isActive("orderedList")} onClick={() => editor?.chain().focus().toggleOrderedList().run()}><ListOrdered size={17} /></ToolBtn>
        <ToolBtn title="Quote / citation" active={editor?.isActive("blockquote")} onClick={() => editor?.chain().focus().toggleBlockquote().run()}><Quote size={17} /></ToolBtn>
        <ToolBtn title="Code block" active={editor?.isActive("codeBlock")} onClick={() => editor?.chain().focus().toggleCodeBlock().run()}><Code2 size={17} /></ToolBtn>

        <ToolDivider />

        {/* Insert */}
        <ToolBtn title="Insert link (DOI / reference)" active={editor?.isActive("link")} onClick={setLink}><Link2 size={17} /></ToolBtn>
        <ToolBtn title="Section divider" onClick={() => editor?.chain().focus().setHorizontalRule().run()}><Minus size={17} /></ToolBtn>

        <div className="flex-1 min-w-[0.5rem]" />

        {/* Active Users */}
        <div className="flex items-center gap-1.5">
          {activeUsers.map(
            (u) =>
              u.user && (
                <div
                  key={u.clientId}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                  style={{ backgroundColor: u.user.color }}
                  title={u.user.name}
                >
                  {u.user.name.charAt(0).toUpperCase()}
                </div>
              )
          )}
        </div>

        {/* Connection Status */}
        <div className="flex items-center gap-1.5 text-xs font-medium ml-2">
          {status === "connected" ? (
            <span className="flex items-center gap-1 text-emerald-500"><Wifi size={14} /> Synced</span>
          ) : (
            <span className="flex items-center gap-1 text-amber-500"><WifiOff size={14} /> {status === "connecting" ? "Reconnecting..." : "Offline"}</span>
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

      <style dangerouslySetInnerHTML={{ __html: `
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

export function CollaborativeEditorInner() {
  const { doc, provider, status, activeUsers } = useYjs();

  // Until the realtime provider is connected there is no `awareness`; render a
  // lightweight placeholder instead of building the editor (which would try to
  // dereference the null provider).
  if (!doc || !provider) {
    return (
      <div className="bg-white dark:bg-[#0F172A] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-center h-[700px]">
        <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
          <Loader2 size={18} className="animate-spin" /> Connecting to the collaborative session…
        </div>
      </div>
    );
  }

  return <EditorSurface doc={doc} status={status} activeUsers={activeUsers} />;
}

function CollaborativeEditorWithKey() {
  const { versionTrigger } = useYjs();
  return <CollaborativeEditorInner key={versionTrigger} />;
}

export function CollaborativeEditor({ documentId = "default-doc" }: { documentId?: string }) {
  return (
    <YjsProvider documentId={documentId}>
      <CollaborativeEditorWithKey />
    </YjsProvider>
  );
}
