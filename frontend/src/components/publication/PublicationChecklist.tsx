"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, UploadCloud, CheckCircle2, AlertTriangle, ArrowRight, 
  Download, Sparkles, BookOpen, Quote, Check, Loader2, RefreshCw, X 
} from 'lucide-react';
import { API } from '@/config/api';
import { useApi } from '@/context/AuthContext';

interface ChecklistItem {
  id: number;
  task: string;
  category: string;
  required: boolean;
}

interface ManuscriptAnalysis {
  title: string | null;
  abstract: string | null;
  full_text: string;
  page_count: number;
  word_count: number;
  char_count: number;
}

interface Journal {
  title: string;
  issn: string;
  subject: string;
  sjr: number;
  h_index: number;
  country: string;
  publisher: string;
  quartile: string;
  open_access: boolean;
}

interface Template {
  id: string;
  name: string;
  publisher: string;
  format: string;
  url: string;
}

const TEMPLATES: Template[] = [
  { id: 'ieee', name: 'IEEE Conference Template', publisher: 'IEEE', format: 'Word / LaTeX', url: 'https://www.ieee.org/content/dam/ieee-org/ieee/web/org/pubs/conference-template-a4.docx' },
  { id: 'nature', name: 'Nature Manuscript Template', publisher: 'Springer Nature', format: 'LaTeX', url: 'https://www.nature.com/documents/nature-latex-template.zip' },
  { id: 'springer', name: 'Springer Lecture Notes (LNCS)', publisher: 'Springer', format: 'LaTeX', url: 'https://www.springer.com/gp/authors-editors/journal-author/journal-author-helpdesk/preparation/1285' },
  { id: 'acm', name: 'ACM Sigconf Article Template', publisher: 'ACM', format: 'Word / LaTeX', url: 'https://www.acm.org/binaries/content/assets/publications/word_style/acm_submission_template.docx' }
];

export function PublicationChecklist({ setActiveTab }: { setActiveTab: (tab: 'checklist' | 'citations' | 'feedback' | 'journals') => void }) {
  const { fetchWithAuth } = useApi();
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  // User checklist checkbox states
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());

  // Upload/Extraction states
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dynamic analysis states
  const [manuscript, setManuscript] = useState<ManuscriptAnalysis | null>(null);
  const [targetJournal, setTargetJournal] = useState<Journal | null>(null);
  const [generatedCitation, setGeneratedCitation] = useState<string | null>(null);
  const [aiFeedback, setAiFeedback] = useState<any | null>(null);
  const [templateDownloaded, setTemplateDownloaded] = useState(false);

  // Load backend checklist schema and restore localStorage
  useEffect(() => {
    // 1. Fetch checklist schema
    fetchWithAuth(API.publications.checklist)
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          setItems(json.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingList(false));

    // 2. Load cached data
    loadCachedStates();

    // 3. Setup event listeners for tab changes or updates
    const handleJournalChange = () => {
      const saved = localStorage.getItem("publication_target_journal");
      setTargetJournal(saved ? JSON.parse(saved) : null);
    };
    const handleCitationChange = () => {
      setGeneratedCitation(localStorage.getItem("publication_generated_citation"));
    };
    const handleFeedbackChange = () => {
      const saved = localStorage.getItem("publication_ai_feedback");
      setAiFeedback(saved ? JSON.parse(saved) : null);
    };

    window.addEventListener("publication_target_journal_changed", handleJournalChange);
    window.addEventListener("publication_citation_changed", handleCitationChange);
    window.addEventListener("publication_feedback_changed", handleFeedbackChange);

    return () => {
      window.removeEventListener("publication_target_journal_changed", handleJournalChange);
      window.removeEventListener("publication_citation_changed", handleCitationChange);
      window.removeEventListener("publication_feedback_changed", handleFeedbackChange);
    };
  }, []);

  const loadCachedStates = () => {
    const savedChecked = localStorage.getItem('publication_checklist_manual');
    if (savedChecked) {
      setCheckedItems(new Set(JSON.parse(savedChecked)));
    }

    const savedManuscript = localStorage.getItem("publication_manuscript_analysis");
    if (savedManuscript) {
      try {
        setManuscript(JSON.parse(savedManuscript));
      } catch (e) {}
    }

    const savedJournal = localStorage.getItem("publication_target_journal");
    if (savedJournal) {
      try {
        setTargetJournal(JSON.parse(savedJournal));
      } catch (e) {}
    }

    setGeneratedCitation(localStorage.getItem("publication_generated_citation"));

    const savedFeedback = localStorage.getItem("publication_ai_feedback");
    if (savedFeedback) {
      try {
        setAiFeedback(JSON.parse(savedFeedback));
      } catch (e) {}
    }

    setTemplateDownloaded(localStorage.getItem("publication_template_downloaded") === 'true');
  };

  const handleManualToggle = (id: number) => {
    setCheckedItems(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      localStorage.setItem('publication_checklist_manual', JSON.stringify([...next]));
      return next;
    });
  };

  const clearAnalysis = () => {
    setManuscript(null);
    localStorage.removeItem("publication_manuscript_analysis");
    // Optionally also remove pre-filled inputs
    localStorage.removeItem("publication_feedback_inputs");
    localStorage.removeItem("publication_citation_form");
  };

  // PDF Text Extraction Upload
  const handleFileUpload = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setUploadError("Only PDF files are supported for manuscript extraction.");
      return;
    }

    setUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetchWithAuth(API.library.extractPdf, {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (json.success && json.data) {
        const data = json.data as ManuscriptAnalysis;
        setManuscript(data);
        localStorage.setItem("publication_manuscript_analysis", JSON.stringify(data));

        // Pre-fill Citation and Feedback tabs
        const currentCitationForm = localStorage.getItem("publication_citation_form");
        const citationForm = currentCitationForm ? JSON.parse(currentCitationForm) : {};
        citationForm.title = data.title || "";
        localStorage.setItem("publication_citation_form", JSON.stringify(citationForm));

        const currentFeedbackInputs = localStorage.getItem("publication_feedback_inputs");
        const feedbackInputs = currentFeedbackInputs ? JSON.parse(currentFeedbackInputs) : {};
        feedbackInputs.title = data.title || "";
        feedbackInputs.abstract = data.abstract || "";
        localStorage.setItem("publication_feedback_inputs", JSON.stringify(feedbackInputs));

        // Dispatch events so tabs reload their state if needed
        window.dispatchEvent(new Event("publication_citation_changed"));
        window.dispatchEvent(new Event("publication_feedback_changed"));
      } else {
        setUploadError(json.message || "Failed to extract text from PDF. Ensure the file is not password-protected.");
      }
    } catch (err) {
      setUploadError("Network error. Make sure your ML service is running on port 8000.");
    } finally {
      setUploading(false);
    }
  };

  const onDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  // Trigger Template Download and Auto-check Template Checklist Item
  const downloadTemplateFile = (template: Template) => {
    localStorage.setItem("publication_template_downloaded", "true");
    setTemplateDownloaded(true);
    window.open(template.url, '_blank');
  };

  // --- Manuscript Heuristics Calculations ---
  
  // Abstract Word Count
  const getAbstractWordCount = () => {
    if (!manuscript?.abstract) return 0;
    return manuscript.abstract.trim().split(/\s+/).filter(Boolean).length;
  };

  // Section Presence Checks
  const checkSections = () => {
    if (!manuscript?.full_text) {
      return {
        introduction: false,
        methodology: false,
        results: false,
        discussion: false,
        conclusion: false,
        references: false,
      };
    }
    const txt = manuscript.full_text;
    return {
      introduction: /\b(introduction|background)\b/i.test(txt),
      methodology: /\b(methodology|methods|materials\s+and\s+methods|experimental|implementation)\b/i.test(txt),
      results: /\b(results|findings|evaluation|performance\s+analysis)\b/i.test(txt),
      discussion: /\b(discussion)\b/i.test(txt),
      conclusion: /\b(conclusion|concluding\s+remarks|summary)\b/i.test(txt),
      references: /\b(references|bibliography|works\s+cited)\b/i.test(txt),
    };
  };

  const detectedSections = checkSections();
  const sectionKeys = Object.keys(detectedSections) as Array<keyof typeof detectedSections>;
  const totalSectionsDetected = sectionKeys.filter(k => detectedSections[k]).length;

  // Extract Keywords heuristically
  const detectKeywords = () => {
    if (!manuscript?.full_text) return [];
    const match = manuscript.full_text.match(/(?:keywords|key\s+words|index\s+terms)[:\s]+([^\n.]+)/i);
    if (match && match[1]) {
      return match[1].split(/[,;]/).map(k => k.trim()).filter(Boolean);
    }
    return [];
  };

  const detectedKeywords = detectKeywords();

  // --- Dynamic Check Assessment Matrix ---
  const evaluateItem = (item: ChecklistItem): { done: boolean; detail?: string; warning?: boolean; action?: () => void; actionLabel?: string } => {
    switch (item.id) {
      case 1: // Define research question and objectives
        if (manuscript?.title) {
          const chars = manuscript.title.length;
          if (chars < 10) return { done: true, detail: "Title is brief", warning: true };
          if (chars > 150) return { done: true, detail: "Title is long (> 150 chars)", warning: true };
          return { done: true, detail: `Title detected: "${manuscript.title.slice(0, 40)}..."` };
        }
        break;
      case 3: // Write abstract (max 250 words)
        if (manuscript?.abstract) {
          const words = getAbstractWordCount();
          if (words > 250) {
            return { done: false, detail: `Abstract exceeds 250 words (${words} words)`, warning: true };
          }
          if (words < 80) {
            return { done: true, detail: `Abstract is short (${words} words, recommend > 80)`, warning: true };
          }
          return { done: true, detail: `Abstract: ${words} words (Passed)` };
        }
        break;
      case 4: // Select keywords (5–10 terms)
        if (detectedKeywords.length > 0) {
          if (detectedKeywords.length < 3) {
            return { done: true, detail: `Only ${detectedKeywords.length} keywords detected: ${detectedKeywords.join(", ")}`, warning: true };
          }
          return { done: true, detail: `Keywords detected: ${detectedKeywords.slice(0, 4).join(", ")}${detectedKeywords.length > 4 ? "..." : ""}` };
        }
        break;
      case 5: // Choose target journal using Scimago Finder
        if (targetJournal) {
          return { 
            done: true, 
            detail: `Target: ${targetJournal.title} (SJR: ${targetJournal.sjr.toFixed(2)}, ${targetJournal.quartile})`,
            action: () => setActiveTab('journals'),
            actionLabel: 'Change'
          };
        }
        return { 
          done: false, 
          detail: "No target journal selected.", 
          action: () => setActiveTab('journals'), 
          actionLabel: "Find Journal" 
        };
      case 6: // Download and apply journal template
        if (templateDownloaded) {
          return { done: true, detail: "Template selected/downloaded." };
        }
        break;
      case 7: // Generate formatted citations
        if (generatedCitation) {
          return { 
            done: true, 
            detail: "Citation generated successfully.",
            action: () => setActiveTab('citations'),
            actionLabel: "View"
          };
        }
        return { 
          done: false, 
          detail: "No citation generated yet.", 
          action: () => setActiveTab('citations'), 
          actionLabel: "Generate" 
        };
      case 9: // Get AI writing feedback on abstract
        if (aiFeedback) {
          return { 
            done: true, 
            detail: `AI Feedback received. Overall Score: ${aiFeedback.overall_score}/10`,
            action: () => setActiveTab('feedback'),
            actionLabel: "View Review"
          };
        }
        return { 
          done: false, 
          detail: "AI evaluation not requested yet.", 
          action: () => setActiveTab('feedback'), 
          actionLabel: "Get Feedback" 
        };
      case 10: // Check manuscript against journal author guidelines
        if (manuscript) {
          if (totalSectionsDetected === 6) {
            return { done: true, detail: "All standard structural sections detected." };
          } else {
            const missing = sectionKeys.filter(k => !detectedSections[k]).map(s => s.charAt(0).toUpperCase() + s.slice(1));
            return { 
              done: false, 
              detail: `Missing sections: ${missing.join(", ")}`, 
              warning: true 
            };
          }
        }
        break;
      default:
        break;
    }

    // Default to manual checkbox toggling
    return { done: checkedItems.has(item.id) };
  };

  // Calculate dynamic progress
  const getProgressStats = () => {
    if (items.length === 0) return { completed: 0, progress: 0 };
    let completedCount = 0;
    items.forEach(item => {
      const evaluation = evaluateItem(item);
      if (evaluation.done) completedCount++;
    });
    return {
      completed: completedCount,
      progress: Math.round((completedCount / items.length) * 100),
    };
  };

  const { completed: completedCount, progress } = getProgressStats();

  const categoryColors: Record<string, string> = {
    planning: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20',
    writing: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20',
    citations: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20',
    formatting: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
    submission: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
    quality: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-500/20',
    ethics: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20',
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      
      {/* LEFT COLUMN: MANUSCRIPT UPLOAD & HEURISTIC ANALYSIS */}
      <div className="lg:col-span-5 space-y-6">
        
        {/* Manuscript Upload Panel */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-5">
          <h3 className="font-bold text-slate-900 dark:text-white text-base">Manuscript File (PDF)</h3>
          
          {!manuscript ? (
            <div
              onDragEnter={onDrag}
              onDragLeave={onDrag}
              onDragOver={onDrag}
              onDrop={onDrop}
              onClick={triggerFileInput}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[180px] ${
                dragActive
                  ? "border-amber-500 bg-amber-500/5"
                  : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50 dark:bg-slate-900/50"
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf"
              />
              
              {uploading ? (
                <div className="space-y-3">
                  <Loader2 className="animate-spin text-amber-500 mx-auto" size={36} />
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Extracting manuscript data...</p>
                  <p className="text-xs text-slate-400">Reading text and structure via pdfplumber...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto text-amber-500">
                    <UploadCloud size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Drag & Drop your manuscript PDF</p>
                    <p className="text-xs text-slate-400 mt-1">or click to browse from computer</p>
                  </div>
                  <div className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded inline-block">
                    Only PDFs up to 50MB
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="border border-slate-100 dark:border-slate-800 rounded-xl p-4 bg-slate-50 dark:bg-slate-900/50 space-y-4">
              <div className="flex items-start gap-3 justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500 shrink-0">
                    <FileText size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {manuscript.title ? manuscript.title.slice(0, 40) + "..." : "Manuscript PDF"}
                    </p>
                    <p className="text-xs text-slate-400">{manuscript.page_count} pages · {manuscript.word_count} words</p>
                  </div>
                </div>
                <button 
                  onClick={clearAnalysis}
                  className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Word stats mini-badge */}
              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div className="bg-white dark:bg-slate-800 border border-slate-150 dark:border-slate-850 p-2 rounded-lg">
                  <div className="font-bold text-slate-700 dark:text-slate-350">{manuscript.word_count}</div>
                  <div className="text-[9px] uppercase tracking-wider text-slate-400">Word Count</div>
                </div>
                <div className="bg-white dark:bg-slate-800 border border-slate-150 dark:border-slate-850 p-2 rounded-lg">
                  <div className="font-bold text-slate-700 dark:text-slate-350">{manuscript.char_count}</div>
                  <div className="text-[9px] uppercase tracking-wider text-slate-400">Char Count</div>
                </div>
              </div>
            </div>
          )}

          {uploadError && (
            <div className="flex items-start gap-2 text-xs text-red-600 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 p-3 rounded-xl">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              <span>{uploadError}</span>
            </div>
          )}
        </div>

        {/* Structural Analysis Checklist */}
        {manuscript && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Section Detection</h3>
              <span className="text-xs font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">
                {totalSectionsDetected}/6 Found
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Heuristics scan full text for academic headings (e.g. Introduction, Methodology, etc.).
            </p>

            <div className="grid grid-cols-2 gap-2.5">
              {sectionKeys.map(sec => {
                const found = detectedSections[sec];
                return (
                  <div 
                    key={sec} 
                    className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-xs font-semibold capitalize transition-all ${
                      found 
                        ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-700 dark:text-emerald-400" 
                        : "bg-amber-500/5 border-amber-500/10 text-amber-700 dark:text-amber-400"
                    }`}
                  >
                    {found ? (
                      <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                    ) : (
                      <AlertTriangle size={13} className="text-amber-500 shrink-0" />
                    )}
                    <span>{sec}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Templates Download section */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="font-bold text-slate-900 dark:text-white text-base">Academic Paper Templates</h3>
          <p className="text-xs text-slate-400">Download formatted journal templates to speed up manuscript writing.</p>
          
          <div className="space-y-2.5">
            {TEMPLATES.map(t => (
              <div 
                key={t.id} 
                className="flex items-center justify-between p-3 border border-slate-100 dark:border-slate-800 rounded-xl hover:border-amber-500/40 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all group"
              >
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{t.name}</p>
                  <p className="text-[10px] text-slate-400">{t.publisher} · <span className="font-mono text-slate-500">{t.format}</span></p>
                </div>
                <button
                  onClick={() => downloadTemplateFile(t)}
                  className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-white dark:hover:bg-amber-500 dark:text-slate-350 dark:hover:text-white rounded-lg text-slate-500 transition-all flex items-center justify-center"
                  title="Download Template"
                >
                  <Download size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* RIGHT COLUMN: READINESS CHECKLIST */}
      <div className="lg:col-span-7 space-y-6">
        
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center">
              <CheckCircle2 className="text-amber-500" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Publication Readiness Checklist</h2>
              <p className="text-sm text-slate-500">Track and evaluate items required for successful submission</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-850 p-4 rounded-xl">
            <div className="flex justify-between text-xs font-black text-slate-500">
              <span className="uppercase tracking-wider">{completedCount}/{items.length} completed</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 via-violet-500 to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {loadingList ? (
            <div className="flex flex-col justify-center items-center py-12 space-y-2">
              <Loader2 className="animate-spin text-amber-500" size={24} />
              <span className="text-xs text-slate-400">Loading checklist parameters...</span>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map(item => {
                const evalResult = evaluateItem(item);
                const isAuto = [1, 3, 4, 5, 6, 7, 9, 10].includes(item.id);
                const done = evalResult.done;
                
                return (
                  <div
                    key={item.id}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border transition-all ${
                      done
                        ? "bg-emerald-500/[0.02] dark:bg-emerald-950/[0.02] border-emerald-100 dark:border-emerald-900/20"
                        : "border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700"
                    }`}
                  >
                    
                    {/* Checkbox button or static status */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {isAuto ? (
                        <div className={`w-5 h-5 shrink-0 rounded-md border flex items-center justify-center transition-all mt-0.5 ${
                          done 
                            ? "bg-emerald-500 border-emerald-500 text-white" 
                            : "border-slate-300 dark:border-slate-700 text-slate-300"
                        }`}>
                          {done ? (
                            <Check size={11} className="stroke-[3]" />
                          ) : (
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                          )}
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleManualToggle(item.id)}
                          className={`w-5 h-5 shrink-0 rounded-md border flex items-center justify-center transition-all mt-0.5 cursor-pointer ${
                            done 
                              ? "bg-emerald-500 border-emerald-500 text-white" 
                              : "border-slate-300 dark:border-slate-700 hover:border-slate-400"
                          }`}
                        >
                          {done && <Check size={11} className="stroke-[3]" />}
                        </button>
                      )}
                      
                      <div className="min-w-0">
                        <span className={`text-sm font-semibold block leading-tight ${
                          done ? "text-slate-500 dark:text-slate-400 line-through decoration-slate-300 dark:decoration-slate-800" : "text-slate-800 dark:text-slate-250"
                        }`}>
                          {item.task}
                        </span>
                        
                        {/* Auto checking evaluation text details */}
                        {evalResult.detail && (
                          <span className={`text-[11px] font-medium mt-1 inline-flex items-center gap-1 ${
                            evalResult.warning 
                              ? "text-amber-600 dark:text-amber-400" 
                              : "text-slate-400 dark:text-slate-500"
                          }`}>
                            {evalResult.warning && <AlertTriangle size={10} className="shrink-0" />}
                            {isAuto && <span className="opacity-75">[Auto]</span>} {evalResult.detail}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Metadata indicators and CTA links */}
                    <div className="flex items-center gap-2 self-start sm:self-center shrink-0 ml-8 sm:ml-0">
                      
                      {/* Navigate call-to-action button */}
                      {evalResult.action && (
                        <button
                          type="button"
                          onClick={evalResult.action}
                          className="px-2.5 py-1 text-[10px] font-bold text-amber-500 hover:text-white hover:bg-amber-500 dark:hover:bg-amber-500 border border-amber-500/30 rounded-lg transition-all flex items-center gap-1 shrink-0"
                        >
                          {evalResult.actionLabel} <ArrowRight size={10} />
                        </button>
                      )}

                      {item.required && (
                        <span className="text-[9px] font-black uppercase tracking-wider text-red-500 bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded shrink-0">
                          Req
                        </span>
                      )}
                      
                      <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0 ${categoryColors[item.category] || 'bg-slate-100 text-slate-500'}`}>
                        {item.category}
                      </span>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
