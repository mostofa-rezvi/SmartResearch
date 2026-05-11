"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { X, Camera, Save, Loader2, Building, User, FileText, Hash } from "lucide-react";
import { API } from "@/config/api";
import { useAuth } from "@/context/AuthContext";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: any;
  onUpdate: (updatedProfile: any) => void;
}

export default function EditProfileModal({ isOpen, onClose, profile, onUpdate }: EditProfileModalProps) {
  const { token, updateUser: updateAuthUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(profile.avatar_url);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      name: profile.name || "",
      bio: profile.bio || "",
      institution: profile.institution || "",
      interests: profile.research_interests?.interests?.join(", ") || "",
      personal_website: profile.personal_website || "",
      linkedin_url: profile.linkedin_url || "",
      google_scholar_url: profile.google_scholar_url || "",
      researchgate_url: profile.researchgate_url || "",
      educational_status: profile.educational_status || "",
    }
  });

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const interestsArray = data.interests.split(",").map((i: string) => i.trim()).filter((i: string) => i !== "");
      
      const response = await fetch(API.profiles.me, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name: data.name,
          bio: data.bio,
          research_interests: { interests: interestsArray },
          personal_website: data.personal_website,
          linkedin_url: data.linkedin_url,
          google_scholar_url: data.google_scholar_url,
          researchgate_url: data.researchgate_url,
          educational_status: data.educational_status
        })
      });

      if (response.ok) {
        const result = await response.json();
        onUpdate(result.data.user || result.data);
        updateAuthUser({ name: data.name, research_interests: { interests: interestsArray } });
        onClose();
      } else {
        const errData = await response.json();
        setError(errData.message || "Failed to update profile");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload
    const formData = new FormData();
    formData.append("avatar", file);

    try {
      const response = await fetch(API.profiles.avatar, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        const newAvatarUrl = result.data.avatar_url;
        onUpdate({ ...profile, avatar_url: newAvatarUrl });
        // Optionally update auth user too if avatar is stored there
      }
    } catch (err) {
      console.error("Avatar upload failed", err);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-4xl rounded-[40px] shadow-2xl overflow-hidden relative border border-slate-100 flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h2 className="text-2xl font-serif font-black text-primary">Edit Academic Profile</h2>
                <p className="text-sm text-slate-500">Update your researcher identity and interests</p>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white rounded-full transition-colors text-slate-400 hover:text-slate-600 border border-transparent hover:border-slate-200"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-8 max-h-[75vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                
                {/* Avatar Section */}
                <div className="md:col-span-4 flex flex-col items-center">
                  <div className="relative group">
                    <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-4xl font-bold shadow-lg overflow-hidden">
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        profile.name?.[0] || "?"
                      )}
                    </div>
                    <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-3xl">
                      <Camera className="text-white" size={24} />
                      <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                    </label>
                  </div>
                  <p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Change Photo</p>
                </div>

                {/* Form Section */}
                <div className="md:col-span-8 space-y-6">
                  {error && (
                    <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl font-medium">
                      {error}
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="relative">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1.5 block ml-1">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                          {...register("name", { required: "Name is required" })}
                          className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-slate-900 font-medium"
                          placeholder="Dr. Jane Doe"
                        />
                      </div>
                      {errors.name && <p className="text-red-500 text-xs mt-1 ml-1">{errors.name.message as string}</p>}
                    </div>

                    <div className="relative">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1.5 block ml-1">Institution</label>
                      <div className="relative">
                        <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                          {...register("institution")}
                          className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-slate-900 font-medium"
                          placeholder="e.g., Stanford University"
                          disabled // For now, maybe update this later via a search select
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 ml-1 italic">Institution is currently verified via official affiliation.</p>
                    </div>

                    <div className="relative">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1.5 block ml-1">Academic Bio</label>
                      <div className="relative">
                        <FileText className="absolute left-4 top-4 text-slate-400" size={18} />
                        <textarea
                          {...register("bio")}
                          rows={3}
                          className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-slate-900 font-medium resize-none"
                          placeholder="Briefly describe your research focus..."
                        />
                      </div>
                    </div>

                    <div className="relative">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1.5 block ml-1">Research Interests (comma separated)</label>
                      <div className="relative">
                        <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                          {...register("interests")}
                          className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-slate-900 font-medium"
                          placeholder="AI, Ethics, Psychology..."
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="relative">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1.5 block ml-1">Personal Website</label>
                        <input
                          {...register("personal_website")}
                          className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-slate-900 font-medium text-sm"
                          placeholder="https://..."
                        />
                      </div>
                      <div className="relative">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1.5 block ml-1">LinkedIn</label>
                        <input
                          {...register("linkedin_url")}
                          className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-slate-900 font-medium text-sm"
                          placeholder="LinkedIn Profile"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="relative">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1.5 block ml-1">Google Scholar</label>
                        <input
                          {...register("google_scholar_url")}
                          className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-slate-900 font-medium text-sm"
                          placeholder="Scholar URL"
                        />
                      </div>
                      <div className="relative">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1.5 block ml-1">ResearchGate</label>
                        <input
                          {...register("researchgate_url")}
                          className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-slate-900 font-medium text-sm"
                          placeholder="ResearchGate URL"
                        />
                      </div>
                    </div>

                    <div className="relative">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1.5 block ml-1">Educational Status</label>
                      <select
                        {...register("educational_status")}
                        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-slate-900 font-medium appearance-none"
                      >
                        <option value="">Select status...</option>
                        <option value="undergraduate">Undergraduate Student</option>
                        <option value="graduate">Graduate Student</option>
                        <option value="phd">PhD Researcher</option>
                        <option value="professor">Professor / Faculty</option>
                        <option value="industry">Industry Specialist</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="mt-10 pt-6 border-t border-slate-100 flex justify-end gap-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 text-slate-500 font-bold hover:text-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-3 bg-primary text-white font-black rounded-2xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                  Save Changes
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
