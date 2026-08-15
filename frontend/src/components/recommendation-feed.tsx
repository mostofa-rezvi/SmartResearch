import React, { useEffect, useState, useCallback } from "react";
import { CollaboratorCard } from "./collaborator-card";
import CollaborationRequestModal from "./collaboration/CollaborationRequestModal";
import { API } from "@/config/api";
import { useAuth, useApi } from "@/context/AuthContext";
import { 
  Loader2, X, Building, BookOpen, GraduationCap, Award, Globe, FileText, ExternalLink, UserPlus, UserCheck, Clock
} from "lucide-react";

interface RecommendationFeedProps {
  filters?: {
    domains: string[];
    tier: string | null;
    institution: string;
    search?: string;
  };
}

const DOMAIN_MAP: { [key: string]: string[] } = {
  "AI & ML": ["Machine Learning", "Artificial Intelligence", "Data Science & AI", "Ethics in AI"],
  "Bioinformatics": ["Bioinformatics"],
  "Quantum Computing": ["Quantum Computing"],
  "Robotics": ["Robotics"]
};

export function RecommendationFeed({ filters }: RecommendationFeedProps) {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { token } = useAuth();
  const { fetchWithAuth } = useApi();

  // Modal & Detail States
  const [selectedResearcher, setSelectedResearcher] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [papers, setPapers] = useState<any[]>([]);
  const [isLoadingPapers, setIsLoadingPapers] = useState(false);

  // Connection state: { [userId]: 'none' | 'pending' | 'accepted' | 'loading' }
  const [connectionStates, setConnectionStates] = useState<Record<string, string>>({});
  const [connectToast, setConnectToast] = useState<string | null>(null);

  // Card "Connect" → research-proposal modal (auto-creates a team on accept)
  const [proposalTarget, setProposalTarget] = useState<any | null>(null);

  const trackPaperEvent = async (paper: any, action: 'view' | 'bookmark' | 'download') => {
    if (!token) return;
    try {
      await fetchWithAuth(API.users.history, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paper_id: paper.id,
          paper_title: paper.title || "Untitled",
          paper_doi: paper.doi || "",
          action
        })
      });
    } catch (err) {
      console.error("Failed to track paper action:", err);
    }
  };

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const res = await fetchWithAuth(API.discovery.recommendations);
        const json = await res.json();
        if (json.success && json.data) {
          const formatted = json.data.map((r: any) => ({
            id: r.id,
            name: r.name,
            institution: r.institution,
            similarityScore: r.similarityScore,
            publications: r.works_count,
            role: r.role,
            hIndex: r.h_index || 0,
            citations: r.cited_by_count || 0,
            country: r.country || "US",
            interests: (r.research_interests || []).filter((i: any) => typeof i === 'string'),
            // Critical: platform user ID — enables the Connect button when non-null
            internalUserId: r.internalUserId ?? null,
          }));
          setRecommendations(formatted);
        }
      } catch (err) {
        console.error("Failed to fetch recommendations:", err);
      } finally {
        setIsLoading(false);
      }
    };
    if (token) fetchRecommendations();
  }, [token]);

  const fetchPapers = async (id: string) => {
    setIsLoadingPapers(true);
    setPapers([]);
    try {
      const cleanId = id.replace("https://openalex.org/", "");
      const res = await fetchWithAuth(API.researchers.works(cleanId));
      const json = await res.json();
      if (json.success && json.data) {
        setPapers(json.data);
      }
    } catch (err) {
      console.error("Failed to fetch papers:", err);
    } finally {
      setIsLoadingPapers(false);
    }
  };

  const handleCardClick = (rec: any) => {
    setSelectedResearcher(rec);
    setIsModalOpen(true);
    fetchPapers(rec.id);
    // Fetch live connection status when modal opens
    fetchConnectionStatus(rec.internalUserId);
  };

  // Fetch connection status for a given platform user id
  const fetchConnectionStatus = useCallback(async (userId: string | number | undefined) => {
    if (!userId || !token) return;
    try {
      const res = await fetchWithAuth(API.connections.status(String(userId)));
      const json = await res.json();
      if (json.success) {
        setConnectionStates(prev => ({ ...prev, [String(userId)]: json.data.status }));
      }
    } catch {
      // non-critical
    }
  }, [fetchWithAuth, token]);

  // Handle Connect button click
  const handleConnect = async () => {
    if (!selectedResearcher) return;
    const userId = selectedResearcher.internalUserId;
    if (!userId) {
      setConnectToast("Cannot connect — researcher has no platform account yet.");
      setTimeout(() => setConnectToast(null), 3000);
      return;
    }

    setConnectionStates(prev => ({ ...prev, [String(userId)]: 'loading' }));
    try {
      const res = await fetchWithAuth(API.connections.request, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient_id: userId, message: `Hi, I'd love to collaborate with you on ResearchBridge!` })
      });
      const json = await res.json();
      if (json.success) {
        setConnectionStates(prev => ({ ...prev, [String(userId)]: 'pending' }));
        setConnectToast("Connection request sent! 🎉");
      } else if (res.status === 409) {
        setConnectionStates(prev => ({ ...prev, [String(userId)]: json.message.includes('connected') ? 'accepted' : 'pending' }));
        setConnectToast(json.message);
      } else {
        setConnectionStates(prev => ({ ...prev, [String(userId)]: 'none' }));
        setConnectToast("Failed to send request. Try again.");
      }
    } catch {
      setConnectionStates(prev => ({ ...prev, [String(userId)]: 'none' }));
      setConnectToast("Network error. Try again.");
    }
    setTimeout(() => setConnectToast(null), 3500);
  };


  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 30;

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const filteredRecommendations = recommendations.filter(rec => {
    // 1. Filter by Domain
    if (filters?.domains && filters.domains.length > 0) {
      // Get all accepted database interest strings for the checked domains
      const acceptedInterests = filters.domains.flatMap(d => DOMAIN_MAP[d] || [d]);
      
      const hasMatchingDomain = rec.interests.some((interest: string) =>
        acceptedInterests.some(accepted => 
          interest.toLowerCase() === accepted.toLowerCase() || 
          interest.toLowerCase().includes(accepted.toLowerCase())
        )
      );
      if (!hasMatchingDomain) return false;
    }

    // 2. Filter by TrustRank Tier (Gold >= 40, Silver >= 15, Bronze < 15)
    if (filters?.tier) {
      let recTier = "Bronze";
      if (rec.hIndex >= 40) recTier = "Gold";
      else if (rec.hIndex >= 15) recTier = "Silver";
      
      if (recTier !== filters.tier) return false;
    }

    // 3. Filter by Institution
    if (filters?.institution) {
      const search = filters.institution.toLowerCase().trim();
      if (search && !rec.institution.toLowerCase().includes(search)) return false;
    }

    // 4. Free-text search — matches name, institution, or research interests.
    if (filters?.search) {
      const q = filters.search.toLowerCase().trim();
      if (q) {
        const haystack = [rec.name, rec.institution, ...(rec.interests || [])]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
    }

    return true;
  }).sort((a, b) => (b.similarityScore || 0) - (a.similarityScore || 0));

  const totalPages = Math.ceil(filteredRecommendations.length / ITEMS_PER_PAGE);
  const paginatedRecommendations = filteredRecommendations.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-slate-400">
        <Loader2 className="animate-spin mb-4 text-primary dark:text-white" size={32} />
        <p>Analyzing your interests to find the best collaborators...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 mb-8">
        <h2 className="text-h2 text-ink-900 dark:text-white">Recommended collaborators</h2>
        <span className="badge badge-neutral shrink-0">{filteredRecommendations.length} matches</span>
      </div>
      
      {filteredRecommendations.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {paginatedRecommendations.map((rec, i) => (
              <CollaboratorCard
                key={i}
                {...rec}
                onClick={() => handleCardClick(rec)}
                onConnect={() => setProposalTarget(rec)}
              />
            ))}
          </div>
          
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-10">
              <button
                onClick={() => {
                  setCurrentPage(prev => Math.max(prev - 1, 1));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                disabled={currentPage === 1}
                className="px-5 py-2.5 neu-btn text-sm font-bold text-slate-700 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <div className="flex items-center gap-3 neu-inset p-1.5">
                <div className="text-sm font-bold text-slate-500 dark:text-slate-400 px-3 py-1">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="w-px h-6 bg-slate-200 dark:bg-slate-700"></div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget as HTMLFormElement);
                    const pageVal = Number(formData.get('pageJump'));
                    if (pageVal >= 1 && pageVal <= totalPages) {
                      setCurrentPage(pageVal);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                    (e.currentTarget as HTMLFormElement).reset();
                  }}
                  className="flex items-center gap-1.5"
                >
                  <input
                    type="number"
                    name="pageJump"
                    min={1}
                    max={totalPages}
                    placeholder="Go..."
                    className="w-16 px-2 py-1 text-sm text-center bg-transparent border-none outline-none text-slate-700 dark:text-slate-300 placeholder:text-slate-400 font-medium"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1 neu-btn text-slate-600 dark:text-slate-300 text-sm font-bold transition-colors"
                  >
                    Go
                  </button>
                </form>
              </div>
              <button
                onClick={() => {
                  setCurrentPage(prev => Math.min(prev + 1, totalPages));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                disabled={currentPage === totalPages}
                className="px-5 py-2.5 neu-btn text-sm font-bold text-slate-700 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="glass-neu-card flex flex-col items-center text-center p-12">
          <div className="w-14 h-14 neu-icon text-primary dark:text-white flex items-center justify-center mb-4">
            <UserPlus size={24} />
          </div>
          <h3 className="text-h4 text-ink-900 dark:text-white mb-1.5">No collaborators match these filters</h3>
          <p className="text-caption text-ink-500 max-w-sm">Try widening your domains or clearing the institution and tier filters to see more researchers.</p>
        </div>
      )}

      {/* Collaboration proposal modal (card Connect button) */}
      {proposalTarget && (
        <CollaborationRequestModal
          researcher={{
            id: proposalTarget.id,
            name: proposalTarget.name,
            institution: proposalTarget.institution,
            internalUserId: proposalTarget.internalUserId,
          }}
          onClose={() => setProposalTarget(null)}
        />
      )}

      {/* Modal Backdrop */}
      {isModalOpen && selectedResearcher && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in-0 duration-200">
          {/* Modal Container */}
          <div className="relative w-full max-w-3xl max-h-[85vh] flex flex-col glass-neu-card overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-900 flex justify-between items-start gap-4">
              <div className="flex items-start gap-4 md:gap-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-2xl shadow-md shrink-0">
                  {selectedResearcher.name.charAt(0)}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h2 className="text-xl md:text-2xl font-bold font-serif text-slate-900 dark:text-white">
                      {selectedResearcher.name}
                    </h2>
                    <span className="bg-primary/10 text-primary dark:text-white px-3 py-0.5 rounded-full text-xs font-black uppercase tracking-wider border border-primary/20">
                      {selectedResearcher.similarityScore}% Match
                    </span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base font-semibold flex items-center gap-1.5 mb-1.5">
                    {selectedResearcher.role}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-400 dark:text-slate-500 text-xs md:text-sm">
                    <span className="flex items-center gap-1.5"><Building size={14} /> {selectedResearcher.institution}</span>
                    <span className="flex items-center gap-1.5"><Globe size={14} /> {selectedResearcher.country}</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-full transition-colors shrink-0"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-4">
                <div className="glass-neu-card p-4 text-center">
                  <div className="flex justify-center mb-1.5 text-primary dark:text-white">
                    <BookOpen size={20} />
                  </div>
                  <div className="text-lg md:text-xl font-bold text-slate-800 dark:text-white">
                    {selectedResearcher.publications}
                  </div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-ink-400">
                    Publications
                  </div>
                </div>
                <div className="glass-neu-card p-4 text-center">
                  <div className="flex justify-center mb-1.5 text-secondary dark:text-rose-300">
                    <Award size={20} />
                  </div>
                  <div className="text-lg md:text-xl font-bold text-slate-800 dark:text-white">
                    {selectedResearcher.citations.toLocaleString()}
                  </div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-ink-400">
                    Citations
                  </div>
                </div>
                <div className="glass-neu-card p-4 text-center">
                  <div className="flex justify-center mb-1.5 text-emerald-500">
                    <GraduationCap size={20} />
                  </div>
                  <div className="text-lg md:text-xl font-bold text-slate-800 dark:text-white">
                    {selectedResearcher.hIndex}
                  </div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-ink-400">
                    h-Index
                  </div>
                </div>
              </div>

              {/* Research Interests */}
              {selectedResearcher.interests && selectedResearcher.interests.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3">Research Focus</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedResearcher.interests.map((interest: string, i: number) => (
                      <span 
                        key={i} 
                        className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1 rounded-xl text-xs font-semibold border border-slate-200/50 dark:border-slate-700/50"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Publications List */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-slate-800 dark:text-white font-bold text-lg font-serif">
                  <FileText size={20} className="text-primary dark:text-white" />
                  <span>Publications & Works</span>
                </div>
                
                {isLoadingPapers ? (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                    <Loader2 className="animate-spin mb-3 text-primary dark:text-white" size={24} />
                    <p className="text-xs">Fetching research papers...</p>
                  </div>
                ) : papers.length > 0 ? (
                  <div className="space-y-4">
                    {papers.map((paper: any, idx: number) => (
                      <div
                        key={idx}
                        className="glass-neu-card glass-neu-hover p-5 transition-all group/paper"
                      >
                        <div className="flex justify-between items-start gap-4 mb-2">
                          <h4 className="font-bold text-slate-900 dark:text-white group-hover/paper:text-primary transition-colors text-sm md:text-base leading-snug">
                            {paper.landing_page_url ? (
                              <a href={paper.landing_page_url} target="_blank" rel="noopener noreferrer" className="hover:underline" onClick={() => trackPaperEvent(paper, 'view')}>
                                {paper.title}
                              </a>
                            ) : (
                              paper.title
                            )}
                          </h4>
                          {paper.landing_page_url && (
                            <a 
                              href={paper.landing_page_url} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="p-1.5 neu-btn hover:bg-primary/10 text-slate-400 hover:text-primary transition-all shrink-0"
                              onClick={() => trackPaperEvent(paper, 'view')}
                            >
                              <ExternalLink size={14} />
                            </a>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-400 dark:text-slate-500">
                          <span className="font-semibold">{paper.journal || "Unknown Journal"}</span>
                          <span>•</span>
                          <span>{paper.publication_year}</span>
                          {paper.citation_count > 0 && (
                            <>
                              <span>•</span>
                              <span className="font-semibold text-secondary dark:text-rose-300">{paper.citation_count} Citations</span>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="glass-neu-card p-8 text-center text-slate-400">
                    <p className="text-sm">No recorded publications found for this researcher.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-100 dark:border-slate-900 bg-slate-50 dark:bg-slate-950 flex justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2.5 neu-btn text-slate-700 dark:text-slate-300 font-bold text-sm transition-all"
              >
                Close
              </button>
              {(() => {
                const uid = selectedResearcher?.internalUserId;
                const connStatus = uid ? (connectionStates[String(uid)] || 'none') : 'unavailable';
                if (connStatus === 'accepted') {
                  return (
                    <button disabled className="px-6 py-2.5 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-bold rounded-xl text-sm flex items-center gap-2 cursor-default">
                      <UserCheck size={16} /> Connected
                    </button>
                  );
                }
                if (connStatus === 'pending') {
                  return (
                    <button disabled className="px-6 py-2.5 bg-amber-500/10 text-amber-600 border border-amber-500/20 font-bold rounded-xl text-sm flex items-center gap-2 cursor-default">
                      <Clock size={16} /> Request Pending
                    </button>
                  );
                }
                if (connStatus === 'loading') {
                  return (
                    <button disabled className="px-6 py-2.5 bg-primary/10 text-primary dark:text-white font-bold rounded-xl text-sm flex items-center gap-2 cursor-wait">
                      <Loader2 size={16} className="animate-spin" /> Sending...
                    </button>
                  );
                }
                if (connStatus === 'unavailable') {
                  return (
                    <button disabled className="px-6 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-400 font-bold rounded-xl text-sm flex items-center gap-2 cursor-not-allowed">
                      <UserPlus size={16} /> Connect
                    </button>
                  );
                }
                return (
                  <button
                    onClick={handleConnect}
                    className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl text-sm shadow-md transition-all flex items-center gap-2"
                  >
                    <UserPlus size={16} /> Connect
                  </button>
                );
              })()}
            </div>

            {/* Toast notification */}
            {connectToast && (
              <div className="absolute bottom-20 left-1/2 -translate-x-1/2 px-5 py-2.5 bg-slate-900 dark:bg-slate-700 text-white text-sm font-semibold rounded-xl shadow-xl animate-in fade-in-0 slide-in-from-bottom-2 duration-300 whitespace-nowrap z-50">
                {connectToast}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
