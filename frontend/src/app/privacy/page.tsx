"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HeroBackdrop from "@/components/marketing/HeroBackdrop";
import Link from "next/link";
import {
  Shield,
  Lock,
  Eye,
  Database,
  Cpu,
  Share2,
  Clock,
  UserCheck,
  Globe2,
  GraduationCap,
  Cookie,
  Link2,
  RefreshCw,
  Mail,
  FileText,
  CheckCircle2,
} from "lucide-react";

const LAST_UPDATED = "August 12, 2026";
const VERSION = "3.4";

type Block =
  | { p: string }
  | { list: string[] }
  | { subheading: string };

type Section = {
  id: string;
  icon: React.ReactNode;
  title: string;
  blocks: Block[];
};

const sections: Section[] = [
  {
    id: "introduction",
    icon: <Shield size={22} />,
    title: "1. Introduction & Scope",
    blocks: [
      {
        p: "ResearchBridge (\"SmartResearch\", \"we\", \"us\", or \"our\") is a unified platform for scholarly discovery, real-time laboratory collaboration, and academic mentorship. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website, applications, and related services (collectively, the \"Platform\").",
      },
      {
        p: "This Policy applies to all users of the Platform — students, researchers, faculty, institutional administrators, and visitors. By accessing or using the Platform, you acknowledge that you have read and understood this Policy. If you do not agree, please do not use the Platform.",
      },
      {
        p: "Where you use the Platform on behalf of a university, department, or research group, that institution may also act as a data controller for certain information, and additional institutional agreements may apply.",
      },
    ],
  },
  {
    id: "information-we-collect",
    icon: <Eye size={22} />,
    title: "2. Information We Collect",
    blocks: [
      { p: "We collect information in three ways: information you provide directly, information generated as you use the Platform, and information from third-party academic services you connect." },
      { subheading: "a. Account & Institutional Identity" },
      {
        list: [
          "Name, username, and profile details (biography, avatar, research interests).",
          "Institutional email address and university or laboratory affiliation.",
          "ORCID iD and, where you choose to link them, Crossref, Google Scholar, or ResearchGate identifiers.",
          "Academic role and verification status (e.g., student, PhD candidate, professor).",
        ],
      },
      { subheading: "b. Research Content & Collaboration Data" },
      {
        list: [
          "Manuscripts, drafts, LaTeX/Markdown documents, datasets, and files you upload to your library or lab workspaces.",
          "Posts, questions, answers, comments, citations, and messages you create.",
          "Membership, roles, and permissions within lab groups and mentorship relationships.",
        ],
      },
      { subheading: "c. Usage, Device & Technical Data" },
      {
        list: [
          "Semantic search queries, papers viewed or saved, and citation activity used to calibrate recommendations.",
          "Log data such as IP address, browser type, operating system, referring pages, and timestamps.",
          "Device and diagnostic information used to maintain security and improve performance.",
        ],
      },
    ],
  },
  {
    id: "how-we-use",
    icon: <Cpu size={22} />,
    title: "3. How We Use Your Information",
    blocks: [
      { p: "We use your information to operate, secure, and improve the Platform, specifically to:" },
      {
        list: [
          "Provide core features: literature discovery, lab co-authoring, mentorship matching, and community discourse.",
          "Personalize your semantic search and recommendation engine based on your fields and activity.",
          "Verify academic identity and prevent impersonation, fraud, and abuse.",
          "Communicate with you about updates, security alerts, and support requests.",
          "Analyze aggregated, de-identified trends to improve product quality and reliability.",
          "Comply with legal obligations and enforce our Terms of Service.",
        ],
      },
    ],
  },
  {
    id: "legal-bases",
    icon: <FileText size={22} />,
    title: "4. Legal Bases for Processing (GDPR)",
    blocks: [
      { p: "For users in the European Economic Area, the United Kingdom, and similar jurisdictions, we process personal data under the following legal bases:" },
      {
        list: [
          "Contract — to deliver the services you request when you create an account.",
          "Legitimate interests — to secure the Platform, prevent abuse, and improve our services, balanced against your rights.",
          "Consent — for optional features such as marketing communications and non-essential cookies, which you may withdraw at any time.",
          "Legal obligation — where processing is required to comply with applicable law.",
        ],
      },
    ],
  },
  {
    id: "ai-safeguards",
    icon: <Database size={22} />,
    title: "5. AI, Machine Learning & IP Sovereignty",
    blocks: [
      {
        p: "SmartResearch guarantees that your private and unpublished research — raw datasets, manuscript drafts, and confidential lab documents — is NEVER sold, or used to train public or third-party AI foundation models.",
      },
      {
        p: "Our AI research assistant and semantic engine operate on vector embeddings generated to power your own discovery and summarization. You retain 100% intellectual property ownership of your research. Any model improvements derived from your content use aggregated, de-identified signals only, and you may opt out of optional model-improvement analytics in your settings.",
      },
    ],
  },
  {
    id: "how-we-share",
    icon: <Share2 size={22} />,
    title: "6. How We Share Information",
    blocks: [
      { p: "We do not sell your personal information. We share information only in the limited circumstances below:" },
      {
        list: [
          "With other users, according to the visibility you choose (e.g., public profile fields, public posts, or members of a private lab).",
          "With service providers (cloud hosting, analytics, email delivery) bound by contractual confidentiality and data-protection obligations.",
          "With academic integrations you explicitly connect, such as ORCID or Crossref.",
          "For legal reasons — to comply with law, respond to lawful requests, or protect the rights, safety, and property of users and the public.",
          "In a merger, acquisition, or asset transfer, subject to this Policy and notice to you.",
        ],
      },
    ],
  },
  {
    id: "retention",
    icon: <Clock size={22} />,
    title: "7. Data Retention",
    blocks: [
      {
        p: "We retain personal data for as long as your account is active or as needed to provide the Platform. We retain and use information as necessary to comply with legal obligations, resolve disputes, and enforce agreements. When data is no longer needed, we delete or irreversibly de-identify it.",
      },
      {
        p: "You can delete individual content at any time. Deleting your account triggers removal of your personal data from active systems within 30 days, excluding records we are legally required to retain and de-identified aggregates.",
      },
    ],
  },
  {
    id: "security",
    icon: <Lock size={22} />,
    title: "8. Data Security",
    blocks: [
      {
        p: "We apply industry-standard technical and organizational safeguards to protect your information:",
      },
      {
        list: [
          "AES-256 encryption at rest for lab workspaces and uploaded research files.",
          "TLS 1.3 encryption in transit for all data exchanged with the Platform.",
          "Zero-knowledge access controls for private lab meshes — only invited members hold decrypt keys.",
          "Continuous monitoring, least-privilege access, and independent security audits.",
        ],
      },
      {
        p: "No method of transmission or storage is completely secure. While we work hard to protect your data, we cannot guarantee absolute security and encourage you to use a strong, unique password and enable available account protections.",
      },
    ],
  },
  {
    id: "your-rights",
    icon: <UserCheck size={22} />,
    title: "9. Your Rights & Choices",
    blocks: [
      { p: "Depending on your location, you have rights over your personal data, including the right to:" },
      {
        list: [
          "Access — obtain a copy of the personal data we hold about you.",
          "Rectification — correct inaccurate or incomplete data.",
          "Erasure — request deletion of your data (\"right to be forgotten\").",
          "Portability — export your profile and vector index metadata in a machine-readable format.",
          "Restriction & Objection — limit or object to certain processing.",
          "Withdraw consent — for processing based on consent, at any time.",
        ],
      },
      {
        p: "You can exercise most of these rights directly in your Profile Settings, or by contacting our Data Protection Officer. We will respond within the timeframes required by applicable law.",
      },
    ],
  },
  {
    id: "international-transfers",
    icon: <Globe2 size={22} />,
    title: "10. International Data Transfers",
    blocks: [
      {
        p: "SmartResearch operates globally. Your information may be processed in countries other than your own. Where we transfer personal data across borders, we rely on appropriate safeguards such as Standard Contractual Clauses and adequacy decisions to ensure your data receives an equivalent level of protection.",
      },
    ],
  },
  {
    id: "student-privacy",
    icon: <GraduationCap size={22} />,
    title: "11. Student & Academic Records (FERPA)",
    blocks: [
      {
        p: "The Platform is intended for users aged 16 and older. We do not knowingly collect personal data from children under this age. Where the Platform is used within an educational institution, we act as a service provider and handle education records consistent with FERPA and applicable institutional data-processing agreements. Institutions remain responsible for obtaining any required consents.",
      },
    ],
  },
  {
    id: "cookies",
    icon: <Cookie size={22} />,
    title: "12. Cookies & Tracking Technologies",
    blocks: [
      {
        p: "We use strictly necessary cookies to keep you signed in and secure, and optional analytics cookies to understand feature usage. You can control non-essential cookies through your browser settings and our in-app preferences. Disabling essential cookies may impair core functionality.",
      },
    ],
  },
  {
    id: "third-parties",
    icon: <Link2 size={22} />,
    title: "13. Third-Party Links & Integrations",
    blocks: [
      {
        p: "The Platform may link to or integrate with third-party academic services (e.g., ORCID, Crossref, publisher DOIs). We are not responsible for the privacy practices of those services. We encourage you to review their privacy policies before sharing information with them.",
      },
    ],
  },
  {
    id: "changes",
    icon: <RefreshCw size={22} />,
    title: "14. Changes to This Policy",
    blocks: [
      {
        p: "We may update this Policy to reflect changes in our practices, technology, or legal requirements. When we make material changes, we will update the \"Last Revised\" date and, where appropriate, notify you through the Platform or by email. Your continued use after an update constitutes acceptance of the revised Policy.",
      },
    ],
  },
];

const highlights = [
  { icon: <Lock size={16} />, text: "AES-256 encrypted lab data" },
  { icon: <Database size={16} />, text: "Never used to train public AI" },
  { icon: <UserCheck size={16} />, text: "Export or delete anytime" },
  { icon: <Shield size={16} />, text: "GDPR · FERPA · CCPA aligned" },
];

const compliance = [
  { name: "GDPR Certified", desc: "EU Data Protection" },
  { name: "FERPA Ready", desc: "Academic Records" },
  { name: "CCPA Compliant", desc: "Privacy Governance" },
  { name: "HIPAA Audited", desc: "Biomedical Data" },
];

function RenderBlock({ block }: { block: Block }) {
  if ("subheading" in block) {
    return (
      <h4 className="mt-6 mb-2 text-base font-bold text-slate-900 dark:text-white">
        {block.subheading}
      </h4>
    );
  }
  if ("list" in block) {
    return (
      <ul className="my-4 space-y-2.5">
        {block.list.map((item, i) => (
          <li key={i} className="flex gap-3 text-slate-600 dark:text-slate-300 leading-relaxed">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-500" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    );
  }
  return <p className="my-4 text-slate-600 dark:text-slate-300 leading-relaxed">{block.p}</p>;
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen overflow-x-clip bg-white dark:bg-[#020617] text-slate-900 dark:text-slate-100 selection:bg-primary/20">
      <Navbar />

      <main className="pt-28 pb-24 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Hero */}
          <header className="relative isolate mb-16 pt-6 pb-10 text-center max-w-4xl mx-auto">
            <HeroBackdrop tone="emerald" />
            <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-md">
              <Shield size={32} />
            </div>
            <h1 className="text-5xl md:text-6xl font-serif font-black text-slate-900 dark:text-white mb-4 leading-tight">
              Privacy <span className="text-emerald-600 dark:text-emerald-400 italic">Policy</span>
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-300 font-medium max-w-2xl mx-auto mb-6">
              How ResearchBridge collects, protects, and gives you control over your academic data.
            </p>
            <div className="inline-flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-slate-500 dark:text-slate-400 font-mono text-xs uppercase tracking-widest">
              <span>Last Revised: {LAST_UPDATED}</span>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <span>Version {VERSION}</span>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <span>~8 min read</span>
            </div>

            {/* At-a-glance highlights */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              {highlights.map((h) => (
                <span
                  key={h.text}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-200"
                >
                  <span className="text-emerald-500">{h.icon}</span>
                  {h.text}
                </span>
              ))}
            </div>
          </header>

          {/* Body: sticky TOC + content */}
          <div className="grid lg:grid-cols-[260px_minmax(0,1fr)] gap-10 lg:gap-16 max-w-6xl mx-auto">
            {/* Table of contents */}
            <aside className="hidden lg:block">
              <div className="sticky top-28">
                <div className="text-[11px] font-mono font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4">
                  On this page
                </div>
                <nav className="space-y-1 border-l border-slate-200 dark:border-white/10">
                  {sections.map((s) => (
                    <a
                      key={s.id}
                      href={`#${s.id}`}
                      className="block -ml-px border-l-2 border-transparent pl-4 py-1.5 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-white hover:border-primary dark:hover:border-white transition-colors"
                    >
                      {s.title}
                    </a>
                  ))}
                </nav>
              </div>
            </aside>

            {/* Document */}
            <div className="min-w-0">
              <div className="p-6 md:p-8 rounded-3xl bg-emerald-50/60 dark:bg-emerald-900/15 border border-emerald-200/70 dark:border-emerald-800/40 mb-12">
                <p className="text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                  <span className="font-bold text-emerald-700 dark:text-emerald-300">In plain terms:</span> your
                  research belongs to you. We encrypt it, we never sell it, we never feed your private work to public AI
                  models, and you can export or delete your data whenever you want. The sections below explain the details.
                </p>
              </div>

              <div className="space-y-14">
                {sections.map((s) => (
                  <section key={s.id} id={s.id} className="scroll-mt-28">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 shadow-sm text-primary dark:text-white">
                        {s.icon}
                      </div>
                      <h2 className="text-2xl font-serif font-black text-slate-900 dark:text-white">
                        {s.title}
                      </h2>
                    </div>
                    <div className="pl-0 md:pl-16">
                      {s.blocks.map((b, i) => (
                        <RenderBlock key={i} block={b} />
                      ))}
                    </div>
                  </section>
                ))}

                {/* Contact / DPO */}
                <section id="contact" className="scroll-mt-28">
                  <div className="p-8 rounded-3xl bg-slate-900 dark:bg-white/5 border border-slate-800 dark:border-white/10 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-white/10 text-white flex items-center justify-center mx-auto mb-5">
                      <Mail size={26} />
                    </div>
                    <h3 className="text-2xl font-serif font-black text-white mb-3">
                      15. Contact Our Data Protection Officer
                    </h3>
                    <p className="text-slate-300 leading-relaxed max-w-xl mx-auto mb-6">
                      Questions about this Policy, or want to exercise your privacy rights? Reach our privacy team and
                      we'll respond within the timeframe required by applicable law.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                      <a
                        href="mailto:privacy@researchbridge.org"
                        className="inline-flex items-center gap-2 bg-white text-slate-900 px-6 py-3 rounded-xl font-bold hover:bg-slate-100 transition-colors"
                      >
                        <Mail size={18} /> privacy@researchbridge.org
                      </a>
                      <Link
                        href="/support"
                        className="inline-flex items-center gap-2 border border-white/25 text-white px-6 py-3 rounded-xl font-bold hover:bg-white/10 transition-colors"
                      >
                        Visit Support Concierge
                      </Link>
                    </div>
                  </div>
                </section>

                {/* Compliance accreditation */}
                <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-3xl border border-slate-200 dark:border-white/10">
                  <h4 className="text-lg font-serif font-black text-slate-900 dark:text-white mb-6 text-center">
                    Institutional Compliance & Data Accreditation
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {compliance.map((std) => (
                      <div
                        key={std.name}
                        className="bg-white dark:bg-slate-800 p-4 rounded-2xl text-center border border-slate-200 dark:border-white/10 shadow-sm"
                      >
                        <div className="font-mono font-black text-xs text-primary dark:text-primary-300 uppercase tracking-widest mb-1">
                          {std.name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium">{std.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
