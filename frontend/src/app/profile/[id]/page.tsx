"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import { API } from "@/config/api";
import { motion } from "framer-motion";
import { User, Award, ShieldCheck, Mail, MapPin, Building, BookOpen, Clock, Activity, MessageSquare, Lightbulb, Users, Bookmark, Settings, Globe, ExternalLink, Microscope } from "lucide-react";
import Link from "next/link";
import EditProfileModal from "@/components/profile/EditProfileModal";

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

  if (loading) return <div className="min-h-screen bg-slate-50  pt-32 text-center text-slate-400">Loading Academic Profile...</div>;
  if (!profile) return <div className="min-h-screen bg-slate-50  pt-32 text-center text-slate-400">Researcher not found.</div>;

  const isOwnProfile = currentUser?.id?.toString() === id;
  const isInvited = profile.role === 'invited_user';

  return (
    <div className="min-h-screen bg-slate-50  pb-20">
      <Navbar />

      {/* Hero Header */}
      <div className="bg-white  border-b border-slate-200  pt-32 pb-12">
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
              <h1 className="text-4xl md:text-5xl font-serif font-black text-primary ">
                {isInvited && profile.extended_profile?.title ? `${profile.extended_profile.title} ` : ''}{profile.name}
              </h1>
              {isInvited && (
                <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] font-black bg-accent/10 text-accent px-4 py-1.5 rounded-full border border-accent/20">
                  <ShieldCheck size={16} /> Verified Expert
                </span>
              )}
            </div>
            
            {profile.institution && (
              <p className="text-slate-500 font-medium flex items-center justify-center md:justify-start gap-2 mb-2">
                <Building size={16} /> {profile.institution} 
                {isInvited && profile.extended_profile?.department && ` • ${profile.extended_profile.department}`}
              </p>
            )}
            
            {(profile.educational_status || profile.researcher_type) && (
              <p className="text-primary text-xs font-black uppercase tracking-widest flex items-center justify-center md:justify-start gap-2 mb-6">
                <Award size={14} /> {(profile.educational_status || profile.researcher_type).replace('_', ' ')}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              {profile.research_interests?.interests?.slice(0, 4).map((tag: string) => (
                <span key={tag} className="text-xs font-bold text-slate-400 bg-slate-100  px-3 py-1.5 rounded-lg border border-slate-200 ">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
          
          {isOwnProfile && (
            <button 
              onClick={() => setIsEditModalOpen(true)}
              className="px-6 py-2.5 bg-slate-100  text-slate-600  font-bold rounded-xl flex items-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              <Settings size={18} /> Edit Profile
            </button>
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
          
          {/* Trust Score & Shared Interests */}
          <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-xl">
            <h3 className="mono-academic text-xs font-black tracking-[0.2em] text-slate-400 mb-6 flex items-center gap-2">
              <ShieldCheck size={18} className="text-emerald-500" /> Trust Score
            </h3>
            <div className="mb-6 flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="text-4xl font-black text-slate-900 mb-2">94/100</div>
              <div className="text-sm font-bold text-amber-500 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                Gold Tier
              </div>
            </div>

            {!isOwnProfile && (
              <>
                <h3 className="mono-academic text-xs font-black tracking-[0.2em] text-slate-400 mb-4 flex items-center gap-2 mt-8">
                  <Users size={18} className="text-primary" /> Shared Interests
                </h3>
                <div className="flex flex-wrap gap-2">
                  {["Machine Learning", "Quantum Computing"].map((interest, idx) => (
                    <span key={idx} className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20">
                      {interest}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Connect Section */}
          {(profile.personal_website || profile.linkedin_url || profile.google_scholar_url || profile.researchgate_url) && (
            <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-xl">
              <h3 className="mono-academic text-xs font-black tracking-[0.2em] text-slate-400 mb-6 flex items-center gap-2">
                <Globe size={18} className="text-primary" /> Connect
              </h3>
              <div className="flex flex-col gap-3">
                {profile.personal_website && (
                  <a href={profile.personal_website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm font-bold text-slate-600 hover:text-primary transition-colors">
                    <Globe size={16} /> Personal Website
                  </a>
                )}
                {profile.linkedin_url && (
                  <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm font-bold text-slate-600 hover:text-primary transition-colors">
                    <ExternalLink size={16} /> LinkedIn Profile
                  </a>
                )}
                {profile.google_scholar_url && (
                  <a href={profile.google_scholar_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm font-bold text-slate-600 hover:text-primary transition-colors">
                    <BookOpen size={16} /> Google Scholar
                  </a>
                )}
                {profile.researchgate_url && (
                  <a href={profile.researchgate_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm font-bold text-slate-600 hover:text-primary transition-colors">
                    <Microscope size={16} /> ResearchGate
                  </a>
                )}
              </div>
            </div>
          )}

          <div className={`bg-white  p-8 rounded-[32px] border ${isInvited ? 'border-accent/30 shadow-accent/5' : 'border-slate-100 '} shadow-2xl`}>
            <h3 className="mono-academic text-xs font-black tracking-[0.2em] text-slate-400 mb-8 flex items-center gap-2">
              <Activity size={18} className="text-secondary" /> Academic Stats
            </h3>
            <div className="space-y-4">
              {[
                { icon: <MessageSquare size={16} />, label: "Discussions", value: profile.activity_stats?.questions_asked + profile.activity_stats?.comments_made || 0, color: "text-blue-500" },
                { icon: <Lightbulb size={16} />, label: "Insights", value: profile.activity_stats?.thoughts_shared || 0, color: "text-amber-500" },
                { icon: <Bookmark size={16} />, label: "Library", value: profile.activity_stats?.saved_papers_count || 0, color: "text-emerald-500" },
                { icon: <Users size={16} />, label: "Groups", value: profile.activity_stats?.joined_groups_count || 0, color: "text-purple-500" }
              ].map((stat, i) => (
                <div key={i} className="flex justify-between items-center bg-slate-50 /50 p-4 rounded-2xl border border-slate-100 ">
                  <div className="flex items-center gap-3">
                    <div className={`${stat.color} opacity-80`}>{stat.icon}</div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{stat.label}</span>
                  </div>
                  <span className="text-xl font-black text-slate-900  leading-none">{stat.value}</span>
                </div>
              ))}
            </div>
          </div>

          {isInvited && (
            <div className="bg-white  p-6 rounded-3xl border border-slate-100  shadow-xl space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                <Mail size={16} /> Contact & Preferences
              </h3>
              <p className="text-sm text-slate-600 ">
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white  p-8 rounded-3xl border border-slate-100  shadow-xl">
              <h3 className="text-xl font-bold text-slate-900  mb-4">Biography</h3>
              <p className="text-slate-600  leading-relaxed font-serif">
                {isInvited && profile.extended_profile?.academic_bio ? profile.extended_profile.academic_bio : profile.bio}
              </p>
            </motion.div>
          )}

          {isInvited && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white  p-6 rounded-3xl border border-slate-100  shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                  <Award size={16} /> Verified Metrics
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100  pb-2">
                    <span className="text-sm text-slate-500">Publications</span>
                    <span className="font-bold text-slate-900 ">{profile.extended_profile?.publications_count || 0}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-100  pb-2">
                    <span className="text-sm text-slate-500">h-index</span>
                    <span className="font-bold text-slate-900 ">{profile.extended_profile?.h_index || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-500">Supervised</span>
                    <span className="font-bold text-slate-900 ">{profile.extended_profile?.students_supervised || 0}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white  p-6 rounded-3xl border border-slate-100  shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                  <BookOpen size={16} /> Ongoing Projects
                </h3>
                {profile.extended_profile?.ongoing_projects ? (
                  <ul className="list-disc pl-4 text-sm text-slate-600  space-y-2">
                    {(profile.extended_profile.ongoing_projects as string[]).map((proj, i) => <li key={i}>{proj}</li>)}
                  </ul>
                ) : (
                  <p className="text-sm italic text-slate-400">No public ongoing projects listed.</p>
                )}
              </div>
            </div>
          )}

          {/* Common Timeline */}
          <div className="bg-white  p-8 rounded-3xl border border-slate-100  shadow-xl">
            <h3 className="text-xl font-bold text-slate-900  mb-6 flex items-center gap-3">
              <Clock className="text-primary" /> Community Activity
            </h3>
            
            {profile.recent_activity?.length > 0 ? (
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 dark:before:via-slate-700 before:to-transparent">
                {profile.recent_activity.map((activity: any, idx: number) => (
                  <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white  bg-primary/20 text-primary shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm relative z-10 text-xs">
                      {activity.type === 'post' ? <MessageSquare size={14} /> : <MessageSquare size={14} strokeWidth={1.5} />}
                    </div>
                    <div className="bg-slate-50  w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl border border-slate-100 ">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">
                        {new Date(activity.created_at).toLocaleDateString()}
                      </span>
                      {activity.title && <h4 className="font-bold text-sm text-slate-900  mb-1 line-clamp-1">{activity.title}</h4>}
                      <p className="text-xs text-slate-500 line-clamp-2">{activity.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center italic text-slate-400 py-10">No recent open activity found on the platform.</p>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
