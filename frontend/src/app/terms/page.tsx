"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HeroBackdrop from "@/components/marketing/HeroBackdrop";
import Link from "next/link";
import {
  Gavel,
  FileText,
  BookOpen,
  UserCheck,
  ShieldCheck,
  ShieldAlert,
  Users,
  Cpu,
  Award,
  CreditCard,
  Link2,
  AlertTriangle,
  Scale,
  Ban,
  RefreshCw,
  Mail,
  CheckCircle2,
  Globe2,
} from "lucide-react";

const EFFECTIVE = "August 12, 2026";
const VERSION = "4.1";

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
    id: "agreement",
    icon: <FileText size={22} />,
    title: "1. Agreement to Terms",
    blocks: [
      {
        p: "These Terms of Service (\"Terms\") govern your access to and use of the ResearchBridge platform, applications, and services (collectively, the \"Platform\") operated by SmartResearch (\"we\", \"us\", or \"our\"). By creating an account or using the Platform, you agree to be bound by these Terms and our Privacy Policy.",
      },
      {
        p: "If you access the Platform on behalf of a university department, research laboratory, or other institution, you represent that you are authorized to bind that entity, and \"you\" refers to both you and that entity.",
      },
      { p: "If you do not agree to these Terms, you may not access or use the Platform." },
    ],
  },
  {
    id: "definitions",
    icon: <BookOpen size={22} />,
    title: "2. Definitions",
    blocks: [
      {
        list: [
          "\"User Content\" means any manuscript, dataset, document, post, comment, citation, or other material you submit to the Platform.",
          "\"Lab Workspace\" means a private or public collaborative space for research teams to co-author and share resources.",
          "\"Verified Researcher\" means a user whose academic identity has been confirmed via institutional email or ORCID.",
          "\"Services\" means all features of the Platform, including discovery, collaboration, mentorship, and the AI assistant.",
        ],
      },
    ],
  },
  {
    id: "eligibility",
    icon: <UserCheck size={22} />,
    title: "3. Eligibility & Account Registration",
    blocks: [
      {
        p: "You must be at least 16 years old to use the Platform. You agree to provide accurate, current, and complete information during registration and to keep it updated.",
      },
      {
        list: [
          "You are responsible for maintaining the confidentiality of your credentials.",
          "You are responsible for all activity that occurs under your account.",
          "You must notify us immediately of any unauthorized use or security breach.",
          "One person may not maintain more than one personal account without our permission.",
        ],
      },
    ],
  },
  {
    id: "verification",
    icon: <ShieldCheck size={22} />,
    title: "4. Researcher Verification & Identity",
    blocks: [
      {
        p: "Certain features require academic verification. You must provide accurate credentials during this process. Misrepresentation of academic titles, university affiliations, or ORCID identity is strictly prohibited and may result in immediate suspension or termination.",
      },
      {
        p: "Verification badges signal that we have confirmed an institutional signal (such as an email domain or ORCID link); they are not an endorsement of the quality or accuracy of any user's research.",
      },
    ],
  },
  {
    id: "acceptable-use",
    icon: <ShieldAlert size={22} />,
    title: "5. Acceptable Use Policy",
    blocks: [
      { p: "When using the Platform, you agree NOT to:" },
      {
        list: [
          "Upload content that infringes intellectual property, privacy, or other rights.",
          "Post unlawful, harassing, defamatory, or misleading material.",
          "Fabricate data, plagiarize, or otherwise violate scientific integrity.",
          "Attempt to gain unauthorized access to accounts, systems, or data.",
          "Scrape, crawl, or harvest data except through permitted APIs and within rate limits.",
          "Introduce malware or interfere with the integrity or performance of the Platform.",
          "Use the Platform to send spam or unsolicited communications.",
        ],
      },
    ],
  },
  {
    id: "user-content",
    icon: <Award size={22} />,
    title: "6. User Content & Intellectual Property",
    blocks: [
      {
        p: "You retain 100% ownership of your original manuscripts, datasets, and published papers. We do not claim ownership of your User Content.",
      },
      {
        subheading: "License you grant to us",
      },
      {
        p: "By submitting public content (such as public abstracts, publications, or forum posts), you grant SmartResearch a worldwide, non-exclusive, royalty-free license to host, store, reproduce, and index vector embeddings of that content solely to operate features like discovery, citation tracking, and recommendations. This license ends when you delete the content, except for reasonable backups and de-identified aggregates.",
      },
      {
        p: "Private lab documents and unpublished drafts are not licensed for public indexing and remain confidential to you and your invited collaborators.",
      },
    ],
  },
  {
    id: "lab-mesh",
    icon: <Users size={22} />,
    title: "7. Lab Workspaces & Collaboration",
    blocks: [
      {
        p: "Lab Group administrators are responsible for managing access permissions for invited co-authors and members. SmartResearch is not liable for unauthorized distribution or loss caused by misconfigured permissions within private lab groups.",
      },
      {
        p: "You are responsible for ensuring you have the rights to share any datasets, figures, or third-party materials within a workspace, and for complying with your institution's data-handling policies.",
      },
    ],
  },
  {
    id: "ai-tools",
    icon: <Cpu size={22} />,
    title: "8. AI Assistant & Automated Tools",
    blocks: [
      {
        p: "The AI research assistant provides summaries, citation suggestions, and discovery aids. Its output may be inaccurate or incomplete and must be independently verified before being relied upon in scholarly work. You are solely responsible for content you publish, cite, or submit that was informed by AI features.",
      },
      {
        p: "You may not use AI features to fabricate experimental results, evade peer-review protocols, or generate content that violates academic integrity standards.",
      },
    ],
  },
  {
    id: "integrity",
    icon: <ShieldCheck size={22} />,
    title: "9. Academic Integrity & Anti-Plagiarism",
    blocks: [
      {
        p: "The Platform mandates scientific integrity. Using automated tools to fabricate experimental datasets, plagiarize the work of others, or bypass double-blind peer-review protocols violates these Terms and may result in content retraction, account termination, and notice to the relevant institution.",
      },
    ],
  },
  {
    id: "billing",
    icon: <CreditCard size={22} />,
    title: "10. Subscriptions, Billing & Refunds",
    blocks: [
      {
        list: [
          "Paid plans are billed in advance on a recurring monthly or annual basis until cancelled.",
          "You authorize us to charge your payment method for applicable fees and taxes.",
          "You may cancel at any time; access continues until the end of the current billing period.",
          "Except where required by law, fees are non-refundable for partial periods.",
          "We may change pricing with reasonable prior notice; changes apply to the next billing cycle.",
        ],
      },
    ],
  },
  {
    id: "third-parties",
    icon: <Link2 size={22} />,
    title: "11. Third-Party Services",
    blocks: [
      {
        p: "The Platform integrates with third-party services such as ORCID, Crossref, and publisher DOIs. Your use of those services is governed by their own terms and policies. We are not responsible for third-party services and disclaim liability for their availability, accuracy, or conduct.",
      },
    ],
  },
  {
    id: "disclaimers",
    icon: <AlertTriangle size={22} />,
    title: "12. Disclaimers & Warranties",
    blocks: [
      {
        p: "The Platform is provided \"as is\" and \"as available\" without warranties of any kind, whether express or implied, including merchantability, fitness for a particular purpose, and non-infringement. We do not warrant that the Platform will be uninterrupted, error-free, or that discovery results are complete or accurate.",
      },
    ],
  },
  {
    id: "liability",
    icon: <Scale size={22} />,
    title: "13. Limitation of Liability",
    blocks: [
      {
        p: "To the maximum extent permitted by law, SmartResearch and its affiliates will not be liable for any indirect, incidental, special, consequential, or punitive damages, or for loss of data, profits, or research outcomes, arising from your use of the Platform. Our aggregate liability for any claim will not exceed the greater of the amounts you paid to us in the twelve months preceding the claim or USD 100.",
      },
    ],
  },
  {
    id: "indemnification",
    icon: <ShieldAlert size={22} />,
    title: "14. Indemnification",
    blocks: [
      {
        p: "You agree to indemnify and hold harmless SmartResearch, its affiliates, and personnel from any claims, damages, liabilities, and expenses arising out of your User Content, your use of the Platform, or your violation of these Terms or applicable law.",
      },
    ],
  },
  {
    id: "termination",
    icon: <Ban size={22} />,
    title: "15. Termination & Suspension",
    blocks: [
      {
        p: "You may stop using the Platform and delete your account at any time. We may suspend or terminate your access if you violate these Terms, create risk or legal exposure, or if we discontinue the Platform. Upon termination, provisions that by their nature should survive (including ownership, disclaimers, and limitations of liability) will remain in effect.",
      },
    ],
  },
  {
    id: "governing-law",
    icon: <Globe2 size={22} />,
    title: "16. Governing Law & Dispute Resolution",
    blocks: [
      {
        p: "These Terms are governed by the laws of the jurisdiction in which SmartResearch is established, without regard to conflict-of-law principles. You agree to first attempt to resolve any dispute informally by contacting us. If a dispute cannot be resolved informally, it will be subject to the exclusive jurisdiction of the competent courts of that jurisdiction, unless mandatory local law provides otherwise.",
      },
    ],
  },
  {
    id: "changes",
    icon: <RefreshCw size={22} />,
    title: "17. Changes to These Terms",
    blocks: [
      {
        p: "We may modify these Terms from time to time. When we make material changes, we will update the \"Effective\" date and notify you through the Platform or by email. Your continued use after changes take effect constitutes acceptance of the revised Terms.",
      },
    ],
  },
];

const highlights = [
  { icon: <Award size={16} />, text: "You own your research" },
  { icon: <ShieldCheck size={16} />, text: "Integrity enforced" },
  { icon: <Ban size={16} />, text: "Cancel anytime" },
  { icon: <Scale size={16} />, text: "Clear liability limits" },
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
            <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-blue-500" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    );
  }
  return <p className="my-4 text-slate-600 dark:text-slate-300 leading-relaxed">{block.p}</p>;
}

export default function TermsPage() {
  return (
    <div className="min-h-screen overflow-x-clip bg-white dark:bg-[#020617] text-slate-900 dark:text-slate-100 selection:bg-primary/20">
      <Navbar />

      <main className="pt-28 pb-24 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Hero */}
          <header className="relative isolate mb-16 pt-6 pb-10 text-center max-w-4xl mx-auto">
            <HeroBackdrop tone="primary" />
            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-md">
              <Gavel size={32} />
            </div>
            <h1 className="text-5xl md:text-6xl font-serif font-black text-slate-900 dark:text-white mb-4 leading-tight">
              Terms of <span className="text-blue-600 dark:text-blue-400 italic">Service</span>
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-300 font-medium max-w-2xl mx-auto mb-6">
              The agreement that governs scientific collaboration on the ResearchBridge platform.
            </p>
            <div className="inline-flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-slate-500 dark:text-slate-400 font-mono text-xs uppercase tracking-widest">
              <span>Effective: {EFFECTIVE}</span>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <span>Version {VERSION}</span>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <span>~9 min read</span>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              {highlights.map((h) => (
                <span
                  key={h.text}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-200"
                >
                  <span className="text-blue-500">{h.icon}</span>
                  {h.text}
                </span>
              ))}
            </div>
          </header>

          {/* Body: sticky TOC + content */}
          <div className="grid lg:grid-cols-[260px_minmax(0,1fr)] gap-10 lg:gap-16 max-w-6xl mx-auto">
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

            <div className="min-w-0">
              <div className="p-6 md:p-8 rounded-3xl bg-blue-50/60 dark:bg-blue-900/15 border border-blue-200/70 dark:border-blue-800/40 mb-12">
                <p className="text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                  <span className="font-bold text-blue-700 dark:text-blue-300">Summary:</span> use the Platform honestly
                  and for legitimate research. You keep ownership of your work; we get a limited license to make public
                  content discoverable. Fabrication, plagiarism, and misrepresentation are prohibited. These highlights
                  are informational — the full Terms below are what legally apply.
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

                {/* Contact */}
                <section id="contact" className="scroll-mt-28">
                  <div className="p-8 rounded-3xl bg-slate-900 dark:bg-white/5 border border-slate-800 dark:border-white/10 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-white/10 text-white flex items-center justify-center mx-auto mb-5">
                      <Mail size={26} />
                    </div>
                    <h3 className="text-2xl font-serif font-black text-white mb-3">
                      18. Questions About These Terms?
                    </h3>
                    <p className="text-slate-300 leading-relaxed max-w-xl mx-auto mb-6">
                      For questions about these Terms or institutional licensing agreements, contact our team — we're
                      happy to help clarify anything before you agree.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                      <a
                        href="mailto:legal@researchbridge.org"
                        className="inline-flex items-center gap-2 bg-white text-slate-900 px-6 py-3 rounded-xl font-bold hover:bg-slate-100 transition-colors"
                      >
                        <Mail size={18} /> legal@researchbridge.org
                      </a>
                      <Link
                        href="/support"
                        className="inline-flex items-center gap-2 border border-white/25 text-white px-6 py-3 rounded-xl font-bold hover:bg-white/10 transition-colors"
                      >
                        Contact Concierge Support <FileText size={16} />
                      </Link>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
