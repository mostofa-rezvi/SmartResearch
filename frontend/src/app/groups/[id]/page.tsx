"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import { API } from "@/config/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Globe, Lock, MessageSquare, ArrowLeft, Send,
  ThumbsUp, ThumbsDown, Share2, ChevronDown, ChevronUp,
  Lightbulb, Heart, Smile, Star, Zap, Check, X, Copy, LogOut, Search,
  MessageCircle, Mail, ExternalLink, ShieldCheck, Award, User,
  Edit, Trash2, MoreHorizontal, MoreVertical, UserMinus
} from "lucide-react";
import Link from "next/link";

// ─── Types ───────────────────────────────────────────────────────────────────
interface Reaction { [key: string]: number }
interface Post {
  id: number; user_id: number; type: string; title: string; content: string;
  author_name: string; author_role: string; created_at: string;
  group_id: number;
  vote_score: number; upvotes?: number; downvotes?: number; user_vote: number | null;
  comment_count: number; share_count: number;
  reactions: Reaction; user_reaction: string | null;
}
interface Comment {
  id: number; user_id: number; content: string; author_name: string;
  author_role: string; created_at: string;
  vote_score: number; user_vote: number | null;
}
interface GroupMember {
  id: number;
  name: string;
  system_role: string;
  group_role: 'admin' | 'contributor' | 'member';
  institution?: string;
  researcher_type?: string;
  research_interests?: any;
}

// ─── Reaction Config ──────────────────────────────────────────────────────────
const REACTIONS = [
  { type: "insightful", emoji: "💡", label: "Insightful", color: "text-amber-500" },
  { type: "support",    emoji: "🤝", label: "Support",    color: "text-blue-500"  },
  { type: "curious",    emoji: "🔍", label: "Curious",    color: "text-purple-500"},
  { type: "celebrate",  emoji: "🎉", label: "Celebrate",  color: "text-emerald-500"},
  { type: "love",       emoji: "❤️", label: "Love",       color: "text-rose-500"  },
];

function timeAgo(dateString: string) {
  // If the database returns a UTC timestamp without timezone indicator, JS parses it as local.
  // We force it to UTC by appending 'Z' if it lacks one.
  let d = dateString;
  if (!d.endsWith("Z") && !d.match(/[+-]\d{2}:\d{2}$/)) {
    d += "Z";
  }
  const diff = (Date.now() - new Date(d).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function Avatar({ name }: { name: string }) {
  const initials = name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "?";
  const colors = ["from-violet-500 to-purple-600","from-blue-500 to-cyan-600","from-emerald-500 to-teal-600","from-rose-500 to-pink-600","from-amber-500 to-orange-600"];
  const color = colors[name?.charCodeAt(0) % colors.length] || colors[0];
  return (
    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
      {initials}
    </div>
  );
}

// ─── Reaction Picker ──────────────────────────────────────────────────────────
function ReactionPicker({ onReact, userReaction }: { onReact: (type: string) => void; userReaction: string | null }) {
  const [open, setOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const current = REACTIONS.find(r => r.type === userReaction);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={pickerRef}>
      <button
        onMouseEnter={() => setOpen(true)}
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-full transition-all ${
          userReaction ? "bg-primary/10 text-primary ring-1 ring-primary/20 shadow-sm" : "text-slate-400 hover:text-primary hover:bg-primary/5"
        }`}
      >
        <span>{current ? current.label : "React"}</span>
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Invisible bridge to prevent mouse-leave gaps */}
            <div className="absolute bottom-full left-0 w-full h-4 z-[49]" onMouseEnter={() => setOpen(true)} />
            
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              onMouseEnter={() => setOpen(true)}
              onMouseLeave={() => setOpen(false)}
              className="absolute bottom-[calc(100%+8px)] left-0 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-2xl p-1.5 flex gap-1 z-[50] min-w-max"
            >
              {REACTIONS.map(r => (
                <button
                  key={r.type}
                  onClick={(e) => { 
                    e.stopPropagation();
                    onReact(r.type); 
                    setOpen(false); 
                  }}
                  title={r.label}
                  className={`flex flex-col items-center gap-0.5 p-2.5 rounded-xl transition-all hover:bg-primary/5 group/react ${userReaction === r.type ? "bg-primary/10 ring-1 ring-primary/20" : "hover:scale-110"}`}
                >
                  <span className="text-2xl group-hover/react:scale-110 transition-transform">{r.emoji}</span>
                  <span className="text-[9px] font-bold text-slate-500 group-hover/react:text-primary">{r.label}</span>
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Comment Section ──────────────────────────────────────────────────────────
function CommentItem({ comment, token, currentUserId, groupRole, onDelete, onUpdate }: { 
  comment: Comment; token: string; currentUserId: number | null; 
  groupRole: string | null; onDelete: (id: number) => void; 
  onUpdate: (id: number, content: string) => void; 
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [submitting, setSubmitting] = useState(false);

  const canDelete = currentUserId === comment.user_id || groupRole === "admin" || groupRole === "contributor";
  const canEdit = currentUserId === comment.user_id;

  const handleUpdate = async () => {
    if (!editContent.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(API.community.updateComment(String(comment.id)), {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ content: editContent })
      });
      if (res.ok) {
        onUpdate(comment.id, editContent);
        setIsEditing(false);
      }
    } catch {} finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this comment?")) return;
    try {
      const res = await fetch(API.community.deleteComment(String(comment.id)), {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) onDelete(comment.id);
    } catch {}
  };

  return (
    <div className="flex gap-3">
      <Avatar name={comment.author_name} />
      <div className="flex-1 bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-3 border border-slate-100/50 dark:border-slate-700/50">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800 dark:text-white">{comment.author_name}</span>
            <span className="text-[10px] text-slate-400">{timeAgo(comment.created_at)}</span>
          </div>
          {(canEdit || canDelete) && !isEditing && (
            <div className="flex items-center gap-1">
              {canEdit && (
                <button onClick={() => setIsEditing(true)} className="p-1 text-slate-400 hover:text-primary transition-colors">
                  <Edit size={10} />
                </button>
              )}
              {canDelete && (
                <button onClick={handleDelete} className="p-1 text-slate-400 hover:text-rose-500 transition-colors">
                  <Trash2 size={10} />
                </button>
              )}
            </div>
          )}
        </div>
        
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={editContent}
              onChange={e => setEditContent(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs outline-none min-h-[60px] text-slate-700 dark:text-slate-200"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setIsEditing(false)} className="text-[10px] text-slate-400 hover:text-slate-600">Cancel</button>
              <button onClick={handleUpdate} disabled={submitting} className="text-[10px] bg-primary text-white px-3 py-1 rounded-lg font-bold shadow-sm shadow-primary/20">
                {submitting ? "..." : "Save"}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{comment.content}</p>
        )}
      </div>
    </div>
  );
}

function CommentSection({ postId, token, currentUserId, groupRole }: { 
  postId: number; token: string; currentUserId: number | null; groupRole: string | null;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchComments = async () => {
      setLoading(true);
      try {
        const res = await fetch(API.community.comments(String(postId)), {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.data) setComments(data.data);
      } catch (err) {
        console.error("Fetch comments error:", err);
      } finally { setLoading(false); }
    };
    fetchComments();
  }, [postId, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(API.community.comments(String(postId)), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: newComment })
      });
      const data = await res.json();
      if (data.data) {
        setComments(c => [...c, data.data]);
        setNewComment("");
      }
    } finally { setSubmitting(false); }
  };

  return (
    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 space-y-4">
      {/* 1. Add Comment Input (Top) */}
      <form onSubmit={handleSubmit} className="flex gap-3 mb-4">
        <input
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          placeholder="Add your thoughts..."
          className="flex-1 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 text-slate-700 dark:text-slate-200"
        />
        <button
          type="submit"
          disabled={submitting || !newComment.trim()}
          className="bg-primary text-white p-2 rounded-xl disabled:opacity-50 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
        >
          {submitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send size={16} />}
        </button>
      </form>

      {/* 2. Comments List (Bottom) */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-4 text-slate-400 text-sm italic">Loading discussion...</div>
        ) : comments.length === 0 ? (
          <div className="text-center py-4 text-slate-400 text-xs italic bg-slate-50/50 dark:bg-slate-900/30 rounded-xl">No comments yet. Start the conversation!</div>
        ) : comments.map(c => (
          <CommentItem 
            key={c.id} 
            comment={c} 
            token={token} 
            currentUserId={currentUserId} 
            groupRole={groupRole}
            onDelete={id => setComments(prev => prev.filter(x => x.id !== id))}
            onUpdate={(id, content) => setComments(prev => prev.map(x => x.id === id ? { ...x, content } : x))}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Post Composer (Antigravity Chat) ─────────────────────────────────────────
function PostComposer({ groupId, token, user, onPosted }: { groupId: string; token: string; user: any; onPosted: (post: Post) => void }) {
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"Thought" | "Question">("Thought");
  const [expanded, setExpanded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [floatingChars, setFloatingChars] = useState<{ id: number; char: string; x: number }[]>([]);

  const handleKeyUp = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key.length === 1 && Math.random() > 0.7) {
      const id = Date.now();
      setFloatingChars(fc => [...fc.slice(-8), { id, char: e.key, x: Math.random() * 80 + 10 }]);
      setTimeout(() => setFloatingChars(fc => fc.filter(f => f.id !== id)), 1200);
    }
  };

  const handleSubmit = async () => {
    if (!content.trim() || content.length < 10) return;
    setSubmitting(true);
    try {
      const payload: any = { 
        type, 
        title: title || content.slice(0, 60), 
        content 
      };
      const parsedGroupId = parseInt(groupId);
      if (!isNaN(parsedGroupId)) payload.group_id = parsedGroupId;

      const res = await fetch(API.community.posts, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.data) { 
        onPosted(data.data); 
        setContent(""); 
        setTitle(""); 
        setExpanded(false); 
      } else {
        const errorMsg = data.error?.message || data.message || "Failed to create post. Please check your input.";
        alert(errorMsg);
      }
    } catch (err) {
      console.error("Post creation error:", err);
      alert("An unexpected error occurred.");
    } finally { setSubmitting(false); }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
      <div className="p-4 flex items-center gap-3">
        <Avatar name={user?.name || "You"} />
        <button
          onClick={() => setExpanded(true)}
          className="flex-1 text-left bg-slate-50 dark:bg-slate-900/50 rounded-2xl px-4 py-3 text-sm text-slate-400 italic hover:bg-slate-100 transition-all"
        >
          ✨ Share a thought or question with the group...
        </button>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="px-4 pb-4 space-y-3 relative">
              {/* Antigravity floating chars */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {floatingChars.map(fc => (
                  <motion.span
                    key={fc.id}
                    initial={{ y: 0, opacity: 1 }}
                    animate={{ y: -60, opacity: 0 }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    className="absolute bottom-16 text-primary/40 font-mono text-lg font-bold select-none"
                    style={{ left: `${fc.x}%` }}
                  >
                    {fc.char}
                  </motion.span>
                ))}
              </div>

              <div className="flex gap-2">
                {(["Thought", "Question"] as const).map(t => (
                  <button key={t} onClick={() => setType(t)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${type === t ? "bg-primary text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
                  >{t}</button>
                ))}
              </div>

              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title (optional)"
                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />

              <div className="relative">
                <textarea
                  value={content} onChange={e => setContent(e.target.value)} onKeyUp={handleKeyUp}
                  rows={4} placeholder="What's on your research mind? Let your ideas defy gravity..."
                  className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
              </div>

              <div className="flex justify-between items-center">
                <button onClick={() => setExpanded(false)} className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1"><X size={12} /> Cancel</button>
                <button onClick={handleSubmit} disabled={submitting || content.length < 10}
                  className="bg-primary text-white px-5 py-2 rounded-xl text-sm font-bold disabled:opacity-50 hover:bg-primary/90 transition-all flex items-center gap-2"
                >
                  {submitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Send size={14} /> Launch Post</>}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MemberCard({ member, currentUserId, currentUserRole, onRoleUpdate, token, groupId }: { 
  member: GroupMember; currentUserId: number | null; currentUserRole: string | null; 
  onRoleUpdate: (userId: number, newRole: string) => void; token: string; groupId: string;
}) {
  const [loading, setLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const isAdmin = currentUserRole === "admin";
  const isSelf = currentUserId === member.id;

  const handleRoleChange = async (newRole: string) => {
    setLoading(true);
    setShowMenu(false);
    try {
      console.log(`[AdminAction] Changing role for user ${member.id} to ${newRole}`);
      const res = await fetch(API.groups.updateMemberRole(groupId, String(member.id)), {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ role: newRole })
      });
      const data = await res.json();
      if (res.ok) {
        onRoleUpdate(member.id, newRole);
      } else {
        alert(data.error?.message || "Role update failed");
      }
    } catch (err) {
      alert("Network error: Could not update role");
    } finally { setLoading(false); }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-800 p-5 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-4 group hover:border-primary/30 transition-all relative"
    >
      <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-400 group-hover:bg-primary/5 group-hover:text-primary transition-colors shrink-0">
        <User size={28} />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-bold text-slate-900 dark:text-white truncate text-base leading-tight">{member.name || "Anonymous"}</h4>
          {member.group_role === "admin" && <ShieldCheck size={16} className="text-amber-500 shrink-0" />}
          {member.group_role === "contributor" && <Award size={16} className="text-primary shrink-0" />}
        </div>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest truncate">
          {member.researcher_type || "Researcher"} • {member.institution || "Independent"}
        </p>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <Link href={`/profile/${member.id}`} className="p-2.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all">
          <ExternalLink size={20} />
        </Link>
        
        {isAdmin && !isSelf && (
          <div className="relative">
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className={`p-2.5 rounded-xl transition-all ${showMenu ? "bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900"}`}
            >
              <MoreVertical size={20} />
            </button>
            
            <AnimatePresence>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-[100]" onClick={() => setShowMenu(false)} />
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 10, x: 0 }}
                    animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10, x: 0 }}
                    className="absolute right-0 top-full mt-3 w-64 bg-white dark:bg-slate-800 rounded-[2rem] shadow-2xl border border-slate-100 dark:border-slate-700 z-[110] overflow-hidden p-2"
                  >
                    {member.group_role === "member" && (
                      <button 
                        onClick={() => handleRoleChange("contributor")}
                        disabled={loading}
                        className="w-full text-left px-4 py-4 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors flex items-center gap-3 rounded-2xl group/item"
                      >
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover/item:bg-primary group-hover/item:text-white transition-all">
                          <Award size={18} />
                        </div>
                        <span>Promote to Contributor</span>
                      </button>
                    )}
                    {member.group_role === "contributor" && (
                      <button 
                        onClick={() => handleRoleChange("member")}
                        disabled={loading}
                        className="w-full text-left px-4 py-4 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors flex items-center gap-3 rounded-2xl group/item"
                      >
                        <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 group-hover/item:bg-rose-600 group-hover/item:text-white transition-all">
                          <UserMinus size={18} />
                        </div>
                        <span>Remove from Contributor</span>
                      </button>
                    )}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function MemberSection({ title, icon, members, description, currentUserId, currentUserRole, onRoleUpdate, token, groupId }: { 
  title: string; icon: React.ReactNode; members: GroupMember[]; description: string;
  currentUserId: number | null; currentUserRole: string | null; 
  onRoleUpdate: (userId: number, newRole: string) => void; token: string; groupId: string;
}) {
  if (members.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 px-2">
        <div className="p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
          {icon}
        </div>
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">{title}</h3>
          <p className="text-[10px] text-slate-400 font-medium">{description}</p>
        </div>
        <div className="ml-auto text-[10px] font-bold bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-lg text-slate-500">
          {members.length}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {members.map(m => (
          <MemberCard 
            key={m.id} 
            member={m} 
            currentUserId={currentUserId}
            currentUserRole={currentUserRole}
            onRoleUpdate={onRoleUpdate}
            token={token}
            groupId={groupId}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Post Card ────────────────────────────────────────────────────────────────
function PostCard({ post, token, onUpdate, onDelete, currentUserId, groupRole }: { 
  post: Post; token: string; onUpdate: (updated: Partial<Post>) => void; 
  onDelete: (id: number) => void; currentUserId: number | null; groupRole: string | null;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [isDeleting, setIsDeleting] = useState(false);

  const canDelete = currentUserId === post.user_id || groupRole === "admin" || groupRole === "contributor";
  const canEdit = currentUserId === post.user_id;

  const handleUpdate = async () => {
    if (!editContent.trim()) return;
    try {
      const res = await fetch(API.community.updatePost(String(post.id)), {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ title: post.title, content: editContent, tags: [] })
      });
      if (res.ok) {
        const data = await res.json();
        onUpdate(data.data);
        setIsEditing(false);
      }
    } catch {}
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    setIsDeleting(true);
    try {
      const res = await fetch(API.community.deletePost(String(post.id)), {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) onDelete(post.id);
    } catch {} finally { setIsDeleting(false); }
  };

  const handleVote = async (value: 1 | -1) => {
    const newValue = post.user_vote === value ? 0 : value;
    const res = await fetch(API.community.vote(String(post.id)), {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ value: newValue })
    });
    const data = await res.json();
    if (data.data) onUpdate({ 
      vote_score: data.data.vote_score, 
      upvotes: data.data.upvotes,
      downvotes: data.data.downvotes,
      user_vote: newValue === 0 ? null : newValue 
    });
  };

  const handleReact = async (reactionType: string) => {
    const res = await fetch(API.community.react(String(post.id)), {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ reaction_type: reactionType })
    });
    const data = await res.json();
    if (data.data) onUpdate({ reactions: data.data.reactions, user_reaction: data.data.user_reaction });
  };

  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const postUrl = typeof window !== 'undefined' ? `${window.location.origin}/groups/${post.group_id}?post=${post.id}` : "";
  const shareText = `Check out this ${post.type.toLowerCase()} on SmartResearch: ${post.title || post.content.substring(0, 50)}...`;

  const handleShareClick = async () => {
    setShowShareModal(true);
    // Increment share count on backend
    await fetch(API.community.share(String(post.id)), {
      method: "POST", headers: { Authorization: `Bearer ${token}` }
    });
    onUpdate({ share_count: (post.share_count || 0) + 1 });
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(postUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOptions = [
    { name: "Twitter", icon: ({ size }: { size: number }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ), color: "bg-black", url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(postUrl)}&text=${encodeURIComponent(shareText)}` },
    { name: "LinkedIn", icon: ({ size }: { size: number }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451c.981 0 1.771-.773 1.771-1.729V1.729C24 .774 23.206 0 22.225 0z" />
      </svg>
    ), color: "bg-[#0077B5]", url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postUrl)}` },
    { name: "Facebook", icon: ({ size }: { size: number }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ), color: "bg-[#1877F2]", url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}` },
    { name: "WhatsApp", icon: MessageCircle, color: "bg-[#25D366]", url: `https://wa.me/?text=${encodeURIComponent(shareText + " " + postUrl)}` },
    { name: "Email", icon: Mail, color: "bg-slate-600", url: `mailto:?subject=${encodeURIComponent(post.title || "Research Update")}&body=${encodeURIComponent(shareText + "\n\n" + postUrl)}` },
  ];

  const totalReactions = Object.values(post.reactions || {}).reduce((a, b) => a + b, 0);
  const topReactions = REACTIONS.filter(r => (post.reactions?.[r.type] || 0) > 0).slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden"
    >
      {/* Header - Top Left (User) & Top Right (Category/Time/Share) */}
      <div className="flex items-start justify-between p-6 pb-4">
        <div className="flex items-center gap-3">
          <Avatar name={post.author_name} />
          <div>
            <span className="block font-bold text-sm text-slate-900 dark:text-white leading-tight">{post.author_name}</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{post.author_role || "Research Member"}</span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg ${
              post.type === "Question" ? "bg-blue-50 text-blue-600 border border-blue-100" : "bg-purple-50 text-purple-600 border border-purple-100"
            }`}>
              {post.type}
            </span>
            <span className="text-[10px] font-bold text-slate-400">{timeAgo(post.created_at)}</span>
            
            {(canEdit || canDelete) && (
              <div className="flex items-center gap-1 border-l border-slate-100 dark:border-slate-700 pl-2 ml-1">
                {canEdit && (
                  <button onClick={() => setIsEditing(!isEditing)} className={`p-1 transition-colors ${isEditing ? "text-primary" : "text-slate-400 hover:text-primary"}`}>
                    <Edit size={12} />
                  </button>
                )}
                {canDelete && (
                  <button onClick={handleDelete} className="p-1 text-slate-400 hover:text-rose-500 transition-colors" disabled={isDeleting}>
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            )}
          </div>
          
          <div className="relative">
            <button onClick={handleShareClick}
              className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 hover:text-primary transition-all"
            >
              <Share2 size={12} />
              <span>{post.share_count || 0} Shares</span>
            </button>
          </div>
        </div>
      </div>

      {/* Middle - Post Title, Content & Label */}
      <div className="px-6 space-y-3">
        <div className="p-4 bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl border border-slate-100/50 dark:border-slate-700/30">
          {post.title && post.title !== post.content.slice(0, 60) && !isEditing && (
            <h3 className="font-bold text-slate-900 dark:text-white mb-2 leading-snug">{post.title}</h3>
          )}
          
          {isEditing ? (
            <div className="space-y-3">
              <textarea 
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none min-h-[100px] text-slate-700 dark:text-slate-200"
                placeholder="Edit your post..."
              />
              <div className="flex justify-end gap-2">
                <button onClick={() => setIsEditing(false)} className="px-3 py-1 text-[10px] font-bold text-slate-500 hover:text-slate-700 transition-colors">Cancel</button>
                <button onClick={handleUpdate} className="px-4 py-1.5 text-[10px] font-bold bg-primary text-white rounded-lg shadow-sm shadow-primary/20 hover:bg-primary/90 transition-colors">Save Changes</button>
              </div>
            </div>
          ) : (
            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">{post.content}</p>
          )}
        </div>
      </div>

      {/* Bottom - React (Left), Vote (Left), Comment (Right) */}
      <div className="p-6 pt-4 flex items-center justify-between border-t border-slate-50 dark:border-slate-700/50">
        <div className="flex items-center gap-4">
          {/* Reaction Summary (Left of Button) */}
          {totalReactions > 0 && (
            <div className="flex items-center gap-2 pr-2 border-r border-slate-100 dark:border-slate-700">
              <div className="flex -space-x-1.5">
                {topReactions.map(r => <span key={r.type} className="text-sm">{r.emoji}</span>)}
              </div>
              <span className="text-[10px] font-bold text-slate-400">{totalReactions}</span>
            </div>
          )}

          {/* 1. React Option */}
          <ReactionPicker onReact={handleReact} userReaction={post.user_reaction} />

          {/* 2. Vote System (Dual Counters) */}
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-1.5">
              <button onClick={() => handleVote(1)}
                className={`p-1 rounded-lg transition-all ${post.user_vote === 1 ? "text-emerald-500 bg-emerald-50" : "text-slate-400 hover:text-emerald-500"}`}
              >
                <ThumbsUp size={14} />
              </button>
              <span className="text-[10px] font-black text-emerald-600/80">{post.upvotes || 0}</span>
            </div>

            <div className="w-[1px] h-3 bg-slate-200 dark:bg-slate-700 mx-1" />

            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black text-rose-600/80">{post.downvotes || 0}</span>
              <button onClick={() => handleVote(-1)}
                className={`p-1 rounded-lg transition-all ${post.user_vote === -1 ? "text-rose-500 bg-rose-50" : "text-slate-400 hover:text-rose-500"}`}
              >
                <ThumbsDown size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* 3. Comment Section on Right */}
        <button 
          onClick={() => setShowComments(!showComments)}
          className={`group flex items-center gap-2 px-4 py-2 rounded-2xl transition-all ${showComments ? "bg-primary/5 text-primary" : "hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-500"}`}
        >
          <MessageSquare size={16} className={showComments ? "text-primary" : "text-slate-400 group-hover:text-primary transition-colors"} />
          <span className={`text-xs font-bold transition-colors ${showComments ? "text-primary" : "group-hover:text-slate-900 dark:group-hover:text-white"}`}>
            {post.comment_count || 0} Comments
          </span>
          <motion.div animate={{ rotate: showComments ? 180 : 0 }}>
            <ChevronDown size={14} className={showComments ? "text-primary" : "text-slate-300"} />
          </motion.div>
        </button>
      </div>

      {/* Expandable Comment Section */}
      <AnimatePresence>
        {showComments && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }} 
            animate={{ height: "auto", opacity: 1 }} 
            exit={{ height: 0, opacity: 0 }}
            className="px-6 pb-6 overflow-hidden"
          >
            <CommentSection 
              postId={post.id} 
              token={token} 
              currentUserId={currentUserId} 
              groupRole={groupRole} 
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share Modal Portal */}
      <AnimatePresence>
        {showShareModal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowShareModal(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-sm bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl z-[101] overflow-hidden border border-slate-100 dark:border-slate-700 p-8"
            >
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">Share Idea</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Spread the knowledge</p>
                </div>
                <button onClick={() => setShowShareModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              <div className="grid grid-cols-5 gap-4 mb-8">
                {shareOptions.map((opt) => (
                  <button
                    key={opt.name}
                    onClick={() => window.open(opt.url, '_blank')}
                    className="flex flex-col items-center gap-2 group"
                  >
                    <div className={`w-12 h-12 ${opt.color} rounded-2xl flex items-center justify-center text-white shadow-lg shadow-black/10 group-hover:scale-110 group-hover:-rotate-6 transition-all`}>
                      <opt.icon size={20} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-tighter text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white">{opt.name}</span>
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Deep Link</p>
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <div className="flex-1 overflow-hidden">
                    <p className="text-xs text-slate-500 truncate px-2 font-mono">{postUrl}</p>
                  </div>
                  <button 
                    onClick={copyToClipboard}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all ${copied ? "bg-emerald-500 text-white" : "bg-primary text-white hover:opacity-90 shadow-lg shadow-primary/20"}`}
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? "DONE" : "COPY"}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function GroupDetailPage() {
  const { id } = useParams();
  const { user, token, logout } = useAuth();
  const router = useRouter();
  const [group, setGroup] = useState<any>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [feedLoading, setFeedLoading] = useState(true);
  const [membership, setMembership] = useState<{ is_member: boolean; role: string | null } | null>(null);
  const [inviteToast, setInviteToast] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"feed" | "members">("feed");
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);

  const filteredPosts = React.useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return posts;
    return posts.filter(p => 
      (p.title && p.title.toLowerCase().includes(q)) || 
      (p.content && p.content.toLowerCase().includes(q))
    );
  }, [posts, searchQuery]);

  const filteredMembers = React.useMemo(() => {
    const q = memberSearchQuery.toLowerCase().trim();
    if (!q) return members;
    return members.filter(m => m.name.toLowerCase().includes(q));
  }, [members, memberSearchQuery]);

  const updatePost = (postId: number, updatedFields: Partial<Post>) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, ...updatedFields } : p));
  };

  useEffect(() => {
    const fetchGroupAndMembership = async () => {
      try {
        const res = await fetch(API.groups.detail(String(id)));
        if (res.status === 401) { logout(); return; }
        const data = await res.json();
        setGroup(data.data || data);

        if (token) {
          const memRes = await fetch(API.groups.membership(String(id)), {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (memRes.ok) {
            const memData = await memRes.json();
            setMembership(memData.data);
          }
        }
      } catch { } finally { setLoading(false); }
    };
    fetchGroupAndMembership();
  }, [id, token]);

  useEffect(() => {
    if (!token) return;
    const fetchFeed = async () => {
      setFeedLoading(true);
      try {
        const res = await fetch(API.community.groupFeed(String(id)), {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setPosts(data.data || []);
        }
      } catch { } finally { setFeedLoading(false); }
    };
    fetchFeed();
  }, [id, token]);

  useEffect(() => {
    if (activeTab === "members") {
      const fetchMembers = async () => {
        setMembersLoading(true);
        try {
          const res = await fetch(API.groups.members(String(id)));
          if (res.ok) {
            const data = await res.json();
            setMembers(data.data || []);
          }
        } catch { } finally { setMembersLoading(false); }
      };
      fetchMembers();
    }
  }, [id, activeTab]);

  const handleJoin = async () => {
    if (!user) return router.push("/login");
    setJoining(true);
    try {
      await fetch(API.groups.join(String(id)), {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      window.location.reload();
    } catch { } finally { setJoining(false); }
  };

  const handleLeave = async () => {
    if (!confirm("Are you sure you want to leave this group?")) return;
    setLeaving(true);
    try {
      await fetch(API.groups.leave(String(id)), {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      window.location.reload();
    } catch { } finally { setLeaving(false); }
  };

  const copyInviteLink = () => {
    const url = window.location.href;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url);
    } else {
      // Fallback for non-HTTPS environments (like local dev over IP)
      const textArea = document.createElement("textarea");
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
      } catch (err) {
        console.error("Fallback copy failed", err);
      }
      document.body.removeChild(textArea);
    }
    setInviteToast(true);
    setTimeout(() => setInviteToast(false), 2500);
  };


  if (loading) return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!group) return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
      <div className="text-center">
        <p className="text-slate-500 mb-4">Group not found</p>
        <Link href="/groups" className="text-primary font-bold hover:underline">← Back to Groups</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Navbar />
      <main className="pt-24 pb-20 max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-4 gap-8">

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <Link href="/groups" className="inline-flex items-center gap-2 text-slate-500 hover:text-primary transition-colors text-sm font-medium">
            <ArrowLeft size={16} /> All Groups
          </Link>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-xl">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-4">
              <Users size={32} />
            </div>
            <h1 className="text-xl font-bold mb-1 text-slate-900 dark:text-white">{group.name}</h1>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">
              {group.type === "public" ? <Globe size={10} /> : <Lock size={10} />}
              {group.type} • {group.focus_area}
            </div>
            <p className="text-sm text-slate-500 mb-5">{group.description}</p>
            
            {!membership?.is_member ? (
              <button onClick={handleJoin} disabled={joining}
                className="w-full bg-primary text-white py-2.5 rounded-xl font-bold text-sm hover:bg-primary/90 transition-all disabled:opacity-60 mb-3"
              >
                {joining ? "Processing..." : "Join Community"}
              </button>
            ) : (
              <div className="mb-3 space-y-2">
                <div className="bg-emerald-50 text-emerald-600 text-center py-2 rounded-xl text-sm font-bold border border-emerald-200">
                  <span className="flex items-center justify-center gap-1.5"><Check size={16} /> Joined as {membership.role === "admin" ? "Admin" : "Member"}</span>
                </div>
                {membership.role !== "admin" && (
                  <button onClick={handleLeave} disabled={leaving}
                    className="w-full bg-slate-100 text-rose-500 py-2 rounded-xl font-bold text-sm hover:bg-rose-50 transition-all disabled:opacity-60 flex items-center justify-center gap-1.5"
                  >
                    <LogOut size={16} /> {leaving ? "Leaving..." : "Leave Group"}
                  </button>
                )}
              </div>
            )}

            <div className="relative">
              <button onClick={copyInviteLink}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 py-2 rounded-xl font-bold text-sm hover:bg-slate-100 transition-all flex items-center justify-center gap-1.5"
              >
                <Copy size={16} /> Invite Link
              </button>
              <AnimatePresence>
                {inviteToast && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                    className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-3 py-1.5 rounded-xl flex items-center gap-1 whitespace-nowrap shadow-lg z-10"
                  >
                    <Check size={12} /> Copied to clipboard!
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Middle Feed */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tab Switcher */}
          <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm w-fit">
            <button
              onClick={() => setActiveTab("feed")}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all relative ${activeTab === "feed" ? "text-primary" : "text-slate-500 hover:text-slate-700"}`}
            >
              {activeTab === "feed" && <motion.div layoutId="activeTab" className="absolute inset-0 bg-primary/10 rounded-xl" />}
              <span className="relative z-10 flex items-center gap-2"><MessageSquare size={16} /> Feed</span>
            </button>
            <button
              onClick={() => setActiveTab("members")}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all relative ${activeTab === "members" ? "text-primary" : "text-slate-500 hover:text-slate-700"}`}
            >
              {activeTab === "members" && <motion.div layoutId="activeTab" className="absolute inset-0 bg-primary/10 rounded-xl" />}
              <span className="relative z-10 flex items-center gap-2"><Users size={16} /> Members</span>
            </button>
          </div>

          <div className="flex items-center gap-4 bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
            <Search className="text-slate-400 ml-2" size={20} />
            {activeTab === "feed" ? (
              <input 
                type="text" 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search discussions by title or content..." 
                className="w-full bg-transparent border-none outline-none text-sm text-slate-800 dark:text-slate-200"
              />
            ) : (
              <input 
                type="text" 
                value={memberSearchQuery}
                onChange={e => setMemberSearchQuery(e.target.value)}
                placeholder="Search members by name..." 
                className="w-full bg-transparent border-none outline-none text-sm text-slate-800 dark:text-slate-200"
              />
            )}
          </div>

          {activeTab === "feed" ? (
            <>
              {feedLoading ? (
                <div className="text-center py-16 text-slate-400">
                  <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  Loading discussions...
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700">
                  <div className="text-4xl mb-3">🔬</div>
                  <p className="font-bold text-slate-700 dark:text-white mb-1">No posts yet</p>
                  <p className="text-sm text-slate-400">Be the first to start a discussion!</p>
                </div>
              ) : filteredPosts.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700">
                  <div className="text-4xl mb-3">🔍</div>
                  <p className="font-bold text-slate-700 dark:text-white mb-1">No matches found</p>
                  <p className="text-sm text-slate-400">Try adjusting your search terms.</p>
                </div>
              ) : (
                filteredPosts.map(post => (
                  <PostCard
                    key={post.id}
                    post={post}
                    token={token || ""}
                    currentUserId={user?.id ? parseInt(user.id) : null}
                    groupRole={membership?.role || null}
                    onUpdate={updated => updatePost(post.id, updated)}
                    onDelete={id => setPosts(prev => prev.filter(p => p.id !== id))}
                  />
                ))
              )}
            </>
          ) : (
            <div className="space-y-8">
              {membersLoading ? (
                <div className="text-center py-16 text-slate-400">
                  <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  Loading member directory...
                </div>
              ) : (
                <>
                  {/* Admin Section */}
                  <MemberSection 
                    title="Admins" 
                    icon={<ShieldCheck className="text-amber-500" size={20} />}
                    members={filteredMembers.filter(m => m.group_role === "admin")}
                    description="The visionary leads managing this community."
                    currentUserId={user?.id ? parseInt(user.id) : null}
                    currentUserRole={membership?.role || null}
                    onRoleUpdate={(userId, newRole) => setMembers(prev => prev.map(m => m.id === userId ? { ...m, group_role: newRole as any } : m))}
                    token={token || ""}
                    groupId={String(id)}
                  />

                  {/* Contributor Section */}
                  <MemberSection 
                    title="Contributors" 
                    icon={<Award className="text-primary" size={20} />}
                    members={filteredMembers.filter(m => m.group_role === "contributor")}
                    description="Top-tier researchers and active collaborators."
                    currentUserId={user?.id ? parseInt(user.id) : null}
                    currentUserRole={membership?.role || null}
                    onRoleUpdate={(userId, newRole) => setMembers(prev => prev.map(m => m.id === userId ? { ...m, group_role: newRole as any } : m))}
                    token={token || ""}
                    groupId={String(id)}
                  />

                  {/* Members Section */}
                  <MemberSection 
                    title="Community Members" 
                    icon={<Users className="text-slate-400" size={20} />}
                    members={filteredMembers.filter(m => m.group_role === "member")}
                    description="Our diverse network of research explorers."
                    currentUserId={user?.id ? parseInt(user.id) : null}
                    currentUserRole={membership?.role || null}
                    onRoleUpdate={(userId, newRole) => setMembers(prev => prev.map(m => m.id === userId ? { ...m, group_role: newRole as any } : m))}
                    token={token || ""}
                    groupId={String(id)}
                  />
                </>
              )}
            </div>
          )}
        </div>

        {/* Right Sidebar - Composer */}
        <div className="lg:col-span-1 space-y-4">
          {user && token ? (
            <PostComposer
              groupId={String(id)}
              token={token}
              user={user}
              onPosted={post => setPosts(ps => [post, ...ps])}
            />
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm text-center">
              <div className="w-12 h-12 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-3">
                <Lock size={20} className="text-slate-400" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-2 text-sm">Join the Conversation</h3>
              <p className="text-xs text-slate-500 mb-4">You need to log in and join this group to post a thought or question.</p>
              <Link href="/login" className="inline-block w-full bg-primary/10 text-primary font-bold text-xs py-2 rounded-xl hover:bg-primary/20 transition-colors">
                Sign In
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
