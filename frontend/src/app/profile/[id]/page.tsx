"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import { API } from "@/config/api";
import { motion } from "framer-motion";
import { User, Award, ShieldCheck, Mail, MapPin, Building, BookOpen, Clock, Activity, MessageSquare, Lightbulb, Users, Bookmark, Settings, Globe, ExternalLink, Microscope, GraduationCap, Trophy, Handshake, Star, FileText } from "lucide-react";
import Link from "next/link";
import EditProfileModal from "@/components/profile/EditProfileModal";
import CredentialDashboard from "@/components/profile/CredentialDashboard";
import TrustBadge from "@/components/profile/TrustBadge";

export default function ProfilePage() {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleProfileUpdate = (updatedProfile: any) => {
    setProfile((prev: any) => ({ ...prev, ...updatedProfile }));
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(API.users.profile(id as string));
        if (response.ok) {
          const result = await response.json();
          setProfile(result.data || result);
        } else {
          setProfile(null);
        }
      } catch (err) {
        console.error("Failed to fetch profile");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id]);

  if (loading) return <div className="min-h-screen app-bg pt-32 text-center text-slate-400">Loading Academic Profile...</div>;
  if (!profile) return <div className="min-h-screen app-bg pt-32 text-center text-slate-400">Researcher not found.</div>;

  const isOwnProfile = currentUser?.id?.toString() === id;
  const isInvited = profile.role === 'invited_user';

  return (
    <div className="min-h-screen app-bg pb-20">
      <Navbar />

      {/* Hero Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 pt-32 pb-12">
        <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row items-center md:items-start gap-8">
          <div className="w-32 h-32 bg-gradient-to-br from-primary to-secondary rounded-3xl flex items-center justify-center text-white text-5xl font-bold shadow-2xl shrink-0 overflow-hidden">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover" />
            ) : (
              profile.name?.[0] || '?'
            )}
          </div>
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
              <h1 className="text-4xl md:text-5xl font-serif font-black text-primary dark:text-white ">
                {isInvited && profile.extended_profile?.title ? `${profile.extended_profile.title} ` : ''}{profile.name}
              </h1>
              {isInvited && (
                <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] font-black bg-accent/10 text-accent px-4 py-1.5 rounded-full border border-accent/20">
                  <ShieldCheck size={16} /> Verified Expert
                </span>
              )}
            </div>
            
            {profile.institution && (
              <p className="text-slate-500 dark:text-slate-400 font-medium flex items-center justify-center md:justify-start gap-2 mb-2">
                <Building size={16} /> {profile.institution} 
                {isInvited && profile.extended_profile?.department && ` • ${profile.extended_profile.department}`}
              </p>
            )}
            
            {(profile.educational_status || profile.researcher_type) && (
              <p className="text-primary dark:text-white text-xs font-black uppercase tracking-widest flex items-center justify-center md:justify-start gap-2 mb-6">
                <Award size={14} /> {(profile.educational_status || profile.researcher_type).replace('_', ' ')}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              {profile.research_interests?.interests?.slice(0, 4).map((tag: string) => (
                <span key={tag} className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
          
          {isOwnProfile && (
            <div className="flex flex-col gap-2 shrink-0">
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="px-6 py-2.5 neu-btn text-slate-600 dark:text-slate-200 font-bold flex items-center justify-center gap-2 transition-colors w-full"
              >
                <Settings size={18} /> Edit Profile
              </button>
              <Link 
                href="/profile/edit-interests"
                className="px-6 py-2.5 bg-primary/10 text-primary dark:text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-primary/20 transition-all border border-primary/20 text-xs w-full text-center"
              >
                <Microscope size={16} /> Edit Interests
              </Link>
            </div>
          )}
        </div>
      </div>

      <EditProfileModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        profile={profile} 
        onUpdate={handleProfileUpdate}
      />

      <main className="max-w-5xl mx-auto px-6 pt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Stats & Contact */}
        <div className="space-y-6">
          
          {/* Trust & Reputation */}
          <div className="glass-neu-card p-8">
            <h3 className="mono-academic text-xs font-black tracking-[0.2em] text-slate-400 mb-6 flex items-center gap-2">
              <ShieldCheck size={18} className="text-emerald-500" /> Trust & Reputation
            </h3>
            <div className="mb-6 flex flex-col items-center justify-center p-6 glass-panel">
              <div className="text-4xl font-black text-slate-900 dark:text-white mb-3">
                {Math.round((profile.trust_rank ?? 0) * 100)}<span className="text-2xl text-slate-400">/100</span>
              </div>
              <TrustBadge tier={profile.trust_tier} institutionVerified={profile.institution_verified} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col items-center justify-center p-4 glass-panel">
                <div className="flex items-center gap-1.5 text-amber-500 mb-1"><Star size={16} /></div>
                <div className="text-xl font-black text-slate-900 dark:text-white leading-none">{profile.reputation_points ?? 0}</div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">Reputation</div>
              </div>
              <div className="flex flex-col items-center justify-center p-4 glass-panel">
                <div className="flex items-center gap-1.5 text-primary dark:text-white mb-1"><Handshake size={16} /></div>
                <div className="text-xl font-black text-slate-900 dark:text-white leading-none">{profile.collaborations_count ?? 0}</div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">Collaborations</div>
              </div>
            </div>

            {!isOwnProfile && profile.research_interests?.interests?.length > 0 && (
              <>
                <h3 className="mono-academic text-xs font-black tracking-[0.2em] text-slate-400 mb-4 flex items-center gap-2 mt-8">
                  <Users size={18} className="text-primary dark:text-white" /> Research Interests
                </h3>
                <div className="flex flex-wrap gap-2">
                  {profile.research_interests.interests.map((interest: string, idx: number) => (
                    <span key={idx} className="text-xs font-bold text-primary dark:text-white bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20">
                      {interest}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Connect Section */}
          {(profile.personal_website || profile.linkedin_url || profile.google_scholar_url || profile.researchgate_url) && (
            <div className="glass-neu-card p-8">
              <h3 className="mono-academic text-xs font-black tracking-[0.2em] text-slate-400 mb-6 flex items-center gap-2">
                <Globe size={18} className="text-primary dark:text-white" /> Connect
              </h3>
              <div className="flex flex-col gap-3">
                {profile.personal_website && (
                  <a href={profile.personal_website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-primary transition-colors">
                    <Globe size={16} /> Personal Website
                  </a>
                )}
                {profile.linkedin_url && (
                  <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-primary transition-colors">
                    <ExternalLink size={16} /> LinkedIn Profile
                  </a>
                )}
                {profile.google_scholar_url && (
                  <a href={profile.google_scholar_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-primary transition-colors">
                    <BookOpen size={16} /> Google Scholar
                  </a>
                )}
                {profile.researchgate_url && (
                  <a href={profile.researchgate_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-primary transition-colors">
                    <Microscope size={16} /> ResearchGate
                  </a>
                )}
              </div>
            </div>
          )}

          <div className={`glass-neu-card p-8 ${isInvited ? 'ring-1 ring-accent/30' : ''}`}>
            <h3 className="mono-academic text-xs font-black tracking-[0.2em] text-slate-400 mb-8 flex items-center gap-2">
              <Activity size={18} className="text-secondary dark:text-rose-300" /> Academic Stats
            </h3>
            <div className="space-y-4">
              {[
                { icon: <MessageSquare size={16} />, label: "Discussions", value: profile.activity_stats?.questions_asked + profile.activity_stats?.comments_made || 0, color: "text-blue-500" },
                { icon: <Lightbulb size={16} />, label: "Insights", value: profile.activity_stats?.thoughts_shared || 0, color: "text-amber-500" },
                { icon: <Bookmark size={16} />, label: "Library", value: profile.activity_stats?.saved_papers_count || 0, color: "text-emerald-500" },
                { icon: <Users size={16} />, label: "Groups", value: profile.activity_stats?.joined_groups_count || 0, color: "text-purple-500" }
              ].map((stat, i) => (
                <div key={i} className="flex justify-between items-center glass-panel p-4">
                  <div className="flex items-center gap-3">
                    <div className={`${stat.color} opacity-80`}>{stat.icon}</div>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{stat.label}</span>
                  </div>
                  <span className="text-xl font-black text-slate-900 dark:text-white leading-none">{stat.value}</span>
                </div>
              ))}
            </div>
          </div>

          {isInvited && (
            <div className="glass-neu-card p-6 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                <Mail size={16} /> Contact & Preferences
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {profile.extended_profile?.contact_preferences || "Contact preferences not strictly defined. Open to academic inquiries."}
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Dynamic Timeline & Portfolio */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Invited User Extended Data */}
          {/* Bio section */}
          {(profile.bio || (isInvited && profile.extended_profile?.academic_bio)) && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-neu-card p-8">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Biography</h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-serif">
                {isInvited && profile.extended_profile?.academic_bio ? profile.extended_profile.academic_bio : profile.bio}
              </p>
            </motion.div>
          )}

          {/* Achievements / Badges */}
          {profile.achievements?.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-neu-card p-8">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                <Trophy className="text-amber-500" /> Achievements
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {profile.achievements.map((badge: any, idx: number) => (
                  <div key={idx} className="flex items-start gap-3 glass-panel p-4">
                    <div className="shrink-0 w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-300 flex items-center justify-center">
                      <Award size={18} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">{badge.title}</h4>
                      {badge.description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{badge.description}</p>}
                      {badge.earned_at && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1 block">
                          {new Date(badge.earned_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Authored Papers */}
          {profile.authored_papers?.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-neu-card p-8">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                <FileText className="text-primary dark:text-white" /> Authored Papers
              </h3>
              <div className="space-y-3">
                {profile.authored_papers.map((paper: any) => (
                  <div key={paper.id} className="flex items-start justify-between gap-4 glass-panel p-4">
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-2">{paper.title}</h4>
                      {paper.created_at && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1 block">
                          {new Date(paper.created_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    {paper.doi && (
                      <a
                        href={`https://doi.org/${paper.doi}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 flex items-center gap-1.5 text-xs font-bold text-primary dark:text-white hover:underline"
                      >
                        DOI <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Mentorship History */}
          {profile.mentorship_history?.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-neu-card p-8">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
                <GraduationCap className="text-secondary dark:text-rose-300" /> Mentorship History
              </h3>
              <div className="space-y-3">
                {profile.mentorship_history.map((m: any) => {
                  const counterpart = m.my_role === 'mentor' ? m.mentee_name : m.mentor_name;
                  return (
                    <div key={m.id} className="flex items-center justify-between gap-4 glass-panel p-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="shrink-0 w-9 h-9 rounded-xl bg-secondary/10 text-secondary dark:text-rose-300 flex items-center justify-center">
                          <Handshake size={16} />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                            {m.my_role === 'mentor' ? 'Mentoring' : 'Mentored by'} {counterpart || 'Researcher'}
                          </h4>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            {m.my_role} {m.created_at && `• ${new Date(m.created_at).toLocaleDateString()}`}
                          </span>
                        </div>
                      </div>
                      <span className={`shrink-0 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                        m.status === 'active' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50'
                        : m.status === 'completed' ? 'bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-300 border-sky-200 dark:border-sky-800/50'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}>
                        {m.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {isInvited && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass-neu-card p-6">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                  <Award size={16} /> Verified Metrics
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-2">
                    <span className="text-sm text-slate-500 dark:text-slate-400">Publications</span>
                    <span className="font-bold text-slate-900 dark:text-white">{profile.extended_profile?.publications_count || 0}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-2">
                    <span className="text-sm text-slate-500 dark:text-slate-400">h-index</span>
                    <span className="font-bold text-slate-900 dark:text-white">{profile.extended_profile?.h_index || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500 dark:text-slate-400">Supervised</span>
                    <span className="font-bold text-slate-900 dark:text-white">{profile.extended_profile?.students_supervised || 0}</span>
                  </div>
                </div>
              </div>

              <div className="glass-neu-card p-6">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                  <BookOpen size={16} /> Ongoing Projects
                </h3>
                {profile.extended_profile?.ongoing_projects ? (
                  <ul className="list-disc pl-4 text-sm text-slate-600 dark:text-slate-300 space-y-2">
                    {(profile.extended_profile.ongoing_projects as string[]).map((proj, i) => <li key={i}>{proj}</li>)}
                  </ul>
                ) : (
                  <p className="text-sm italic text-slate-400">No public ongoing projects listed.</p>
                )}
              </div>
            </div>
          )}

          {/* Common Timeline */}
          <div className="glass-neu-card p-8">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
              <Clock className="text-primary dark:text-white" /> Community Activity
            </h3>
            
            {profile.recent_activity?.length > 0 ? (
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 dark:before:via-slate-700 before:to-transparent">
                {profile.recent_activity.map((activity: any, idx: number) => (
                  <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-slate-700 bg-primary/20 text-primary dark:text-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm relative z-10 text-xs">
                      {activity.type === 'post' ? <MessageSquare size={14} /> : <MessageSquare size={14} strokeWidth={1.5} />}
                    </div>
                    <div className="glass-panel w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">
                        {new Date(activity.created_at).toLocaleDateString()}
                      </span>
                      {activity.title && <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1 line-clamp-1">{activity.title}</h4>}
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{activity.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center italic text-slate-400 py-10">No recent open activity found on the platform.</p>
            )}
          </div>

        </div>

          {/* Credential Dashboard — own profile only */}
          {isOwnProfile && (
            <div className="lg:col-span-3">
              <CredentialDashboard />
            </div>
          )}

      </main>
    </div>
  );
}
