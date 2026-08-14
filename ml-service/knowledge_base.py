"""
Knowledge base for the ResearchBridge AI Assistant.

Two kinds of curated documents, embedded once (with the same SBERT model used for
content search) and retrieved alongside the Elasticsearch corpus inside
``/rag/chat``:

  * ``guide``   — first-party documentation about the ResearchBridge PLATFORM
                  (features and how to use them).
  * ``concept`` — substantive RESEARCH KNOWLEDGE (AI/ML concepts, methods, and
                  research/publishing methodology) so the assistant can actually
                  answer domain questions even when the indexed corpus is thin.

Why this exists: the indexed paper/researcher/post corpus is small, so grounded
retrieval alone often returns "the sources don't contain an answer". These docs
give the assistant a dependable body of knowledge to cite from, making it usable
out of the box. They are additive — as the corpus and product grow, real content
and new entries here layer on top.

Editing: keep each entry a self-contained, factual paragraph on ONE topic so it
embeds and cites cleanly. Prefer explaining "what it is + why it matters + how it
is used". Add entries freely; retrieval thresholds keep irrelevant ones out.
"""

import os
import re
import glob
import logging
from typing import Any, Dict, List

logger = logging.getLogger(__name__)


def _doc(id: str, title: str, type: str, category: str, content: str) -> Dict[str, Any]:
    return {"id": id, "title": title, "type": type, "category": category, "content": content}


# ── File-based knowledge base (drop-in folder) ────────────────────────────────────
# Anything you drop into ml-service/kb_docs/ (*.md or *.txt) is loaded here and
# retrieved by the assistant alongside the curated docs below — no code change
# needed. The folder is bind-mounted into the container (./ml-service:/app), so
# adding a file and asking the assistant again is enough; restart the ML service
# to pick up new files. Override the location with KB_DOCS_DIR.
#
# Optional frontmatter (simple `key: value` lines between `---` fences) sets the
# doc's metadata; sensible defaults are derived from the file otherwise:
#   ---
#   title: Low-resource NLP
#   type: concept        # concept (research knowledge) | guide (platform how-to)
#   category: nlp
#   ---
#   <body text — one self-contained topic per file>

_KB_DOCS_DIR = os.getenv(
    "KB_DOCS_DIR", os.path.join(os.path.dirname(os.path.abspath(__file__)), "kb_docs")
)


def _slugify(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", (text or "").lower()).strip("-") or "doc"


def _parse_frontmatter(raw: str) -> tuple:
    """Split optional `--- key: value ---` frontmatter from the body. No deps."""
    meta: Dict[str, str] = {}
    body = raw
    m = re.match(r"^﻿?---\s*\n(.*?)\n---\s*\n?(.*)$", raw, re.DOTALL)
    if m:
        block, body = m.group(1), m.group(2)
        for line in block.splitlines():
            if ":" in line:
                k, v = line.split(":", 1)
                meta[k.strip().lower()] = v.strip().strip('"').strip("'")
    return meta, body


def _load_folder_docs(directory: str = _KB_DOCS_DIR,
                      existing: List[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
    """Load every *.md / *.txt file under ``directory`` as one KB document each.

    Files whose title collides with a curated doc (``existing``) are skipped so the
    same topic doesn't appear twice under Sources.
    """
    docs: List[Dict[str, Any]] = []
    if not directory or not os.path.isdir(directory):
        return docs
    seen_titles = {(_slugify(d.get("title", ""))) for d in (existing or [])}
    paths = sorted(
        glob.glob(os.path.join(directory, "**", "*.md"), recursive=True)
        + glob.glob(os.path.join(directory, "**", "*.txt"), recursive=True)
    )
    for path in paths:
        # Convention: files whose name starts with "_" or "." are notes/READMEs,
        # not knowledge — skip them so they aren't retrieved as research content.
        if os.path.basename(path)[:1] in ("_", "."):
            continue
        try:
            with open(path, "r", encoding="utf-8") as f:
                raw = f.read()
        except Exception as e:  # pragma: no cover - unreadable file
            logger.warning(f"[KB] could not read {path}: {e}")
            continue
        meta, body = _parse_frontmatter(raw)
        base = os.path.splitext(os.path.basename(path))[0]

        # Title: frontmatter > first markdown heading > filename.
        title = meta.get("title")
        if not title:
            h = re.search(r"^\s*#\s+(.+)$", body, re.MULTILINE)
            title = h.group(1).strip() if h else base.replace("-", " ").replace("_", " ").title()

        # Body: strip markdown headings/formatting to a clean, embeddable paragraph.
        content = re.sub(r"^\s*#.*$", "", body, flags=re.MULTILINE)
        content = re.sub(r"[*_`>#]", " ", content)
        content = re.sub(r"\s+", " ", content).strip()
        if not content:
            continue

        tslug = _slugify(title)
        if tslug in seen_titles:
            logger.info(f"[KB] skipping '{title}' from {os.path.basename(path)} — duplicate title")
            continue
        seen_titles.add(tslug)

        dtype = (meta.get("type") or "concept").strip().lower()
        if dtype not in ("concept", "guide"):
            dtype = "concept"
        docs.append(_doc(
            meta.get("id") or f"kb-file-{_slugify(base)}",
            title,
            dtype,
            (meta.get("category") or "custom").strip().lower(),
            content,
        ))
    if docs:
        logger.info(f"[KB] loaded {len(docs)} file-based doc(s) from {directory}")
    return docs


# ── Platform guides ──────────────────────────────────────────────────────────────

_PLATFORM_DOCS: List[Dict[str, Any]] = [
    _doc("kb-about", "About ResearchBridge", "guide", "platform",
         "ResearchBridge is a collaborative research platform that unifies discovering "
         "literature, connecting with researchers, managing a personal library, writing and "
         "publishing, and community discussion in one place. It combines AI-powered semantic "
         "discovery, a verified global peer network, real-time collaborative lab spaces, and "
         "open-access publishing with DOI generation, helping researchers find relevant work, "
         "form teams, and share findings faster while keeping rigor and reproducibility."),
    _doc("kb-assistant", "AI Research Assistant", "guide", "platform",
         "The AI Research Assistant is a grounded chat companion. It answers questions using the "
         "platform's own papers, researchers, and community posts plus a built-in knowledge base, "
         "and cites the sources it used so answers are verifiable. Use it to find papers on a "
         "topic, identify experts and collaborators, summarize a body of work, understand a "
         "concept, or ask what the community is discussing. Ask a specific question in the chat "
         "box; each answer lists its sources and suggests follow-ups. Open it at /assistant."),
    _doc("kb-discovery", "Discovery — semantic search", "guide", "platform",
         "Discovery is the semantic search engine. Instead of matching keywords only, it "
         "understands scientific context, methodology, and citations to surface the most relevant "
         "papers and researchers. Use it to explore a new field, find related work, or locate "
         "papers by concept rather than exact title. Open Discovery at /discovery; the top search "
         "bar and the DOI lookup tool complement it for direct lookups."),
    _doc("kb-library", "Library — personal collection", "guide", "platform",
         "The Library is your personal collection of saved papers and documents. Save items from "
         "Discovery or search, organize them with tags, read abstracts and full text, and ask "
         "questions about a single paper with Paper Q&A, which answers grounded in that paper's "
         "text with supporting quotes. You can also generate a volume summary across a set of "
         "library items. Open it at /library."),
    _doc("kb-researchers", "Researchers — peer network", "guide", "platform",
         "The Researchers directory lets you find and connect with verified researchers worldwide. "
         "Search by field or interest to find mentors, co-authors, or expert reviewers, view their "
         "profiles and publications, and follow or connect with them. Verified badges and interest "
         "matching help you find the right people. Open it at /researchers."),
    _doc("kb-teams", "Teams and Workspace — lab spaces", "guide", "platform",
         "Teams are collaborative lab spaces where a research group works together with granular "
         "permissions, member activity, and shared resources. The Workspace provides collaborative "
         "documents with a real-time synchronized editor so co-authors write together. Create or "
         "join a team at /teams and open shared documents at /workspace."),
    _doc("kb-groups", "Groups — topic communities", "guide", "platform",
         "Groups are communities organized around a research topic or interest where members share "
         "updates, resources, and discussion. To create a group, open Groups (/groups) and use "
         "'Create group' (/groups/create) to set its name, topic, and visibility, then invite "
         "members. Browse and join existing groups from the same page."),
    _doc("kb-community", "Community — questions and discussion", "guide", "platform",
         "The Community is a discussion forum where researchers post questions, share opinions, and "
         "discuss topics such as methods, reproducibility, and tooling. Browse threads, ask a "
         "question, and answer others to build reputation. The AI Assistant can also surface what "
         "the community is currently discussing on a topic. Open it at /community."),
    _doc("kb-mentorship", "Mentorship — find a mentor or mentee", "guide", "platform",
         "Mentorship connects newer researchers with experienced mentors. Browse available mentors, "
         "request mentorship in your area of interest, or offer to mentor others. It is useful for "
         "early-career researchers seeking guidance on projects, publishing, or career direction. "
         "Open it at /mentorship."),
    _doc("kb-publishing", "Publishing and Blog", "guide", "platform",
         "ResearchBridge supports open-access publishing so you can share findings directly on the "
         "platform, reach a wider audience without paywalls, and get an integrated DOI. You can "
         "also write blog posts to explain your work to a broader audience. Create a blog post at "
         "/blog/create. Published work is discoverable in search and can be cited."),
    _doc("kb-doi", "DOI tool and citations", "guide", "platform",
         "The DOI tool (the 'DOI' button in the top bar) looks up a paper's metadata by its Digital "
         "Object Identifier and helps you import or cite it. The platform can also generate "
         "formatted citations (BibTeX, APA, IEEE) for papers and integrates DOI generation for work "
         "you publish so it can be cited and tracked."),
    _doc("kb-dashboard", "Dashboard and notifications", "guide", "platform",
         "The Dashboard is your home overview after signing in, showing recommended work, recent "
         "activity, and quick links to your library, teams, and groups. Notifications keep you "
         "informed about connection requests, group activity, mentorship, and responses to your "
         "posts. Open the Dashboard at /dashboard or Notifications at /notifications."),
    _doc("kb-profile", "Profile and research interests", "guide", "platform",
         "Your Profile shows your details, publications, and research interests to other "
         "researchers. Keep your research interests up to date (/profile/edit-interests) because "
         "they power recommendations, researcher matching, and who can find you. A complete, "
         "well-tagged profile improves the quality of connections and papers suggested to you."),
    _doc("kb-getting-started", "Getting started on ResearchBridge", "guide", "platform",
         "New here? A good first path: 1) complete your Profile and set research interests so "
         "recommendations are accurate; 2) use Discovery or the AI Assistant to find papers and "
         "save the best to your Library; 3) browse Researchers to follow experts and find "
         "collaborators or a mentor; 4) join a Group or post in the Community; 5) use Teams and "
         "Workspace when you start collaborating on a document."),
]


# ── Research knowledge (AI / ML concepts) ────────────────────────────────────────

_AI_DOCS: List[Dict[str, Any]] = [
    _doc("con-ai", "Artificial Intelligence (AI)", "concept", "ai",
         "Artificial Intelligence is the field of building systems that perform tasks normally "
         "requiring human intelligence, such as perception, reasoning, language, and decision "
         "making. Modern AI is dominated by machine learning, where systems learn patterns from "
         "data rather than following hand-written rules. Subfields include natural language "
         "processing, computer vision, robotics, and knowledge representation."),
    _doc("con-ml", "Machine Learning (ML)", "concept", "ai",
         "Machine learning is a branch of AI where models learn from data to make predictions or "
         "decisions without being explicitly programmed for each case. A model is trained by "
         "optimizing parameters to minimize a loss on training examples, then evaluated on held-out "
         "data to measure generalization. Core paradigms are supervised, unsupervised, and "
         "reinforcement learning."),
    _doc("con-ml-types", "Types of machine learning", "concept", "ai",
         "Supervised learning trains on labeled examples to predict a target (classification or "
         "regression). Unsupervised learning finds structure in unlabeled data (clustering, "
         "dimensionality reduction). Reinforcement learning trains an agent to maximize reward "
         "through trial-and-error interaction with an environment. Self-supervised learning creates "
         "labels from the data itself and now underpins most large pretrained models."),
    _doc("con-deep-learning", "Deep learning and neural networks", "concept", "ai",
         "Deep learning uses neural networks with many layers to learn hierarchical representations "
         "directly from raw data. Each layer transforms its input via learned weights and "
         "non-linear activations; networks are trained by backpropagation and gradient descent. "
         "Deep learning drives most state-of-the-art results in vision, speech, and language, at "
         "the cost of needing large datasets and compute."),
    _doc("con-nlp", "Natural Language Processing (NLP)", "concept", "ai",
         "Natural Language Processing enables computers to understand, generate, and reason about "
         "human language. Tasks include classification, named entity recognition, translation, "
         "summarization, question answering, and sentiment analysis. Modern NLP is built on "
         "transformer models pretrained on large text corpora and then fine-tuned or prompted for "
         "specific tasks."),
    _doc("con-transformers", "Transformers and attention", "concept", "ai",
         "The transformer is a neural architecture based on self-attention, which lets each token "
         "attend to every other token to build context-aware representations. Introduced in "
         "'Attention Is All You Need' (2017), it replaced recurrent networks for most sequence "
         "tasks because it parallelizes well and captures long-range dependencies. Transformers are "
         "the foundation of modern language and multimodal models."),
    _doc("con-llm", "Large Language Models (LLMs)", "concept", "ai",
         "Large Language Models are transformer networks with billions of parameters pretrained on "
         "massive text to predict the next token, giving them broad language and reasoning ability. "
         "They are adapted via fine-tuning, instruction tuning, and prompting, and power chat "
         "assistants, coding tools, and retrieval-augmented systems. Key challenges include "
         "hallucination, context limits, cost, and alignment with human intent."),
    _doc("con-generative-ai", "Generative AI", "concept", "ai",
         "Generative AI creates new content — text, images, audio, code, or video — by modeling the "
         "distribution of training data. Text generation uses autoregressive language models; image "
         "generation commonly uses diffusion models or GANs. It powers writing assistants, image "
         "synthesis, and design tools, and raises questions around originality, copyright, and "
         "misuse."),
    _doc("con-cv", "Computer Vision", "concept", "ai",
         "Computer vision enables machines to interpret images and video, covering classification, "
         "object detection, segmentation, and generation. Convolutional neural networks long "
         "dominated the field; vision transformers now match or exceed them on many benchmarks. "
         "Applications include medical imaging, autonomous driving, and content moderation."),
    _doc("con-rl", "Reinforcement Learning", "concept", "ai",
         "Reinforcement learning trains an agent to take actions in an environment to maximize "
         "cumulative reward, learning a policy through exploration and feedback. Methods range from "
         "value-based (Q-learning) to policy-gradient and actor-critic algorithms. RL powers game-"
         "playing agents and robotics, and reinforcement learning from human feedback (RLHF) is "
         "used to align large language models."),
    _doc("con-diffusion", "Diffusion models", "concept", "ai",
         "Diffusion models generate data by learning to reverse a gradual noising process: they "
         "start from random noise and iteratively denoise it into a coherent sample. They produce "
         "high-quality, diverse images and are the basis of leading text-to-image systems, and are "
         "increasingly applied to audio, video, and molecule generation."),
    _doc("con-gnn", "Graph Neural Networks (GNNs)", "concept", "ai",
         "Graph neural networks operate on graph-structured data by passing and aggregating "
         "messages between connected nodes, learning representations that capture both features and "
         "topology. They are used for molecular property prediction, recommendation, fraud "
         "detection, citation analysis, and author disambiguation, where relationships matter as "
         "much as individual items."),
    _doc("con-embeddings", "Embeddings and sentence encoders", "concept", "ai",
         "Embeddings map words, sentences, or documents to dense vectors so that semantically "
         "similar items lie close together, enabling similarity search and clustering. Sentence "
         "encoders such as Sentence-BERT (SBERT) fine-tune transformer models to produce sentence "
         "embeddings useful for retrieval and semantic search. Embeddings are the backbone of "
         "vector search and retrieval-augmented generation."),
    _doc("con-ir", "Information retrieval and search", "concept", "ai",
         "Information retrieval finds documents relevant to a query. Classic methods rank by lexical "
         "overlap (TF-IDF, BM25); dense retrieval instead embeds queries and documents into vectors "
         "and ranks by similarity, capturing meaning beyond exact words. Hybrid systems combine both, "
         "and re-ranking models refine the top results for precision."),
    _doc("con-rag", "Retrieval-Augmented Generation (RAG)", "concept", "ai",
         "Retrieval-Augmented Generation grounds a language model's answers in external documents: "
         "the system retrieves relevant passages (often via vector search), then conditions the "
         "model on them to produce a cited, up-to-date response. RAG reduces hallucination and lets "
         "models use private or fresh knowledge without retraining. This assistant uses a RAG "
         "pipeline over the platform's corpus and knowledge base."),
    _doc("con-vector-db", "Vector databases and ANN search", "concept", "ai",
         "Vector databases store embeddings and retrieve nearest neighbors quickly for semantic "
         "search. Because exact nearest-neighbor search is costly at scale, they use approximate "
         "nearest neighbor (ANN) indexes such as HNSW graphs, IVF partitioning, and product "
         "quantization (PQ) to trade a little accuracy for large speed and memory gains. They power "
         "RAG, recommendations, and similarity search."),
    _doc("con-transfer", "Transfer learning and fine-tuning", "concept", "ai",
         "Transfer learning reuses a model pretrained on a large general dataset and adapts it to a "
         "specific task with far less data. Fine-tuning updates some or all weights on the target "
         "task; parameter-efficient methods like LoRA and adapters update only a small subset. This "
         "is the standard recipe behind most modern NLP and vision systems."),
    _doc("con-federated", "Federated learning and privacy", "concept", "ai",
         "Federated learning trains a shared model across many devices or institutions without "
         "moving raw data off-site: each participant computes updates locally and only aggregated "
         "updates are combined. It helps satisfy privacy and regulatory constraints, and is often "
         "paired with differential privacy or secure aggregation to further protect individual "
         "records. It is widely studied for healthcare and mobile applications."),
    _doc("con-ssl", "Self-supervised and contrastive learning", "concept", "ai",
         "Self-supervised learning builds training signals from unlabeled data — for example, "
         "predicting masked tokens or matching augmented views of the same image. Contrastive "
         "methods pull representations of related items together and push unrelated ones apart. "
         "These techniques let models learn strong general representations before any labeled "
         "fine-tuning, and underpin most foundation models."),
    _doc("con-multimodal", "Multimodal learning", "concept", "ai",
         "Multimodal models jointly process multiple data types — such as text and images — by "
         "learning a shared representation space. Vision-language models enable image captioning, "
         "visual question answering, and text-to-image retrieval. Aligning modalities (e.g. with "
         "contrastive image-text training) is a central technique and a fast-moving research area."),
    _doc("con-xai", "Explainable AI and interpretability", "concept", "ai",
         "Explainable AI aims to make model decisions understandable to people. Methods include "
         "feature-attribution techniques (such as SHAP and LIME), attention and saliency "
         "visualization, and mechanistic interpretability that probes internal representations. "
         "Explainability supports trust, debugging, regulatory compliance, and fairness auditing, "
         "especially in high-stakes domains."),
    _doc("con-ethics", "AI ethics, fairness, and bias", "concept", "ai",
         "AI ethics studies the societal impact of AI, including fairness, bias, transparency, "
         "accountability, and safety. Models can inherit and amplify biases in training data, so "
         "practitioners measure disparate outcomes across groups and apply mitigation at the data, "
         "model, or decision stage. Responsible AI also covers privacy, consent, environmental "
         "cost, and clear disclosure of automated systems."),
    _doc("con-low-resource-nlp", "Low-resource NLP", "concept", "ai",
         "Low-resource NLP develops language technology for languages or domains with little "
         "labeled data or few digital resources. Common strategies include multilingual pretraining "
         "and cross-lingual transfer, data augmentation, self-supervision, and active learning. It "
         "is central to making AI equitable across the world's thousands of languages."),
    _doc("con-metrics", "Model evaluation metrics", "concept", "ai",
         "Evaluation metrics quantify model quality. Classification uses accuracy, precision, "
         "recall, F1, and ROC-AUC; regression uses MAE, MSE, and R². Ranking and retrieval use "
         "precision@k, recall@k, MAP, and nDCG. Generation is judged with BLEU, ROUGE, perplexity, "
         "and increasingly human or model-based evaluation. Choosing the right metric — and a fair "
         "test split — is essential to trustworthy results."),
    _doc("con-trends", "Current trends in AI research", "concept", "ai",
         "Recent AI research centers on large foundation models and their efficient adaptation: "
         "instruction tuning and RLHF for alignment, retrieval-augmented generation to ground "
         "answers, and agentic systems that plan and use tools. Multimodal models unifying text, "
         "image, audio, and video are advancing rapidly, alongside work on reasoning, long context, "
         "smaller and cheaper models, evaluation, safety, interpretability, and reducing "
         "hallucination and bias."),
    _doc("con-mlops", "MLOps and model deployment", "concept", "ai",
         "MLOps applies software engineering discipline to machine learning: versioning data and "
         "models, reproducible training pipelines, continuous integration and delivery, monitoring "
         "for drift, and rollback. It bridges research and production so models can be deployed, "
         "observed, and updated reliably at scale."),
    _doc("con-knowledge-graphs", "Knowledge graphs", "concept", "ai",
         "A knowledge graph represents entities and the relationships between them as a network of "
         "nodes and edges, enabling structured queries and reasoning. In research, knowledge graphs "
         "link papers, authors, institutions, and topics — powering citation analysis, expert "
         "finding, and recommendation. They are increasingly combined with LLMs for grounded "
         "question answering."),
    _doc("con-recsys", "Recommender systems", "concept", "ai",
         "Recommender systems predict items a user will find relevant. Collaborative filtering uses "
         "patterns across users and items; content-based filtering uses item features; hybrid and "
         "embedding-based methods combine both and often use approximate nearest-neighbor search. "
         "In research platforms they suggest papers, collaborators, and communities from a user's "
         "interests and activity."),
]


# ── Research and publishing methodology ──────────────────────────────────────────

_METHOD_DOCS: List[Dict[str, Any]] = [
    _doc("con-lit-review", "Conducting a literature review", "concept", "methodology",
         "A literature review surveys and synthesizes existing work on a topic to establish context "
         "and identify gaps. A good process defines a clear question, searches multiple databases "
         "with consistent terms, screens results for relevance, reads and organizes by theme rather "
         "than by paper, and cites primary sources. On ResearchBridge, Discovery and the AI "
         "Assistant help find and summarize relevant work to save to your Library."),
    _doc("con-reproducibility", "Reproducibility in research", "concept", "methodology",
         "Reproducibility means others can obtain the same results using your data, code, and "
         "methods; replicability means obtaining consistent results with new data. Good practice "
         "includes sharing code and data, fixing random seeds, documenting environments and "
         "versions, preregistering hypotheses, and reporting enough detail to rerun the study. It "
         "is central to trustworthy science and a recurring community discussion topic."),
    _doc("con-peer-review", "Peer review", "concept", "methodology",
         "Peer review is the evaluation of a manuscript by independent experts before publication to "
         "assess validity, novelty, and clarity. Models include single-blind, double-blind, and "
         "open review. Reviewers judge methodology, evidence, and contribution and recommend accept, "
         "revise, or reject. Understanding reviewer expectations helps authors write clearer, "
         "better-justified papers."),
    _doc("con-open-access", "Open access publishing", "concept", "methodology",
         "Open access makes research freely available to read without a subscription. 'Gold' open "
         "access publishes openly in a journal (sometimes for a fee); 'green' open access "
         "self-archives a version in a repository. Open access widens readership and can increase "
         "citations. ResearchBridge supports open-access publishing with integrated DOI generation."),
    _doc("con-citations", "Citation styles (APA, IEEE, BibTeX)", "concept", "methodology",
         "Citations credit prior work and let readers trace sources. Styles differ in formatting: "
         "APA is common in social sciences, IEEE in engineering, and many others exist. BibTeX is a "
         "machine-readable format used with LaTeX to manage references and auto-format bibliographies. "
         "ResearchBridge can generate BibTeX, APA, and IEEE citations for papers."),
    _doc("con-doi-orcid", "DOI and ORCID", "concept", "methodology",
         "A DOI (Digital Object Identifier) is a permanent identifier for a paper or dataset that "
         "resolves to its current location, making references stable over time. An ORCID iD is a "
         "persistent identifier for a researcher that disambiguates authors and links them to their "
         "work. Both improve discoverability and correct attribution; ResearchBridge uses DOIs for "
         "lookup, citation, and publishing."),
    _doc("con-research-ethics", "Research ethics and IRB", "concept", "methodology",
         "Research ethics governs how studies are conducted responsibly, especially with human or "
         "animal subjects. An Institutional Review Board (IRB) reviews protocols for informed "
         "consent, risk, privacy, and data protection before research begins. Ethical practice also "
         "covers honest reporting, avoiding plagiarism and fabrication, managing conflicts of "
         "interest, and complying with regulations such as GDPR."),
    _doc("con-writing-paper", "Writing a research paper", "concept", "methodology",
         "A typical research paper follows IMRaD: Introduction (problem and contribution), Methods "
         "(what you did, reproducibly), Results (findings with figures and statistics), and "
         "Discussion (interpretation, limitations, future work), plus an abstract and references. "
         "Strong papers state a clear contribution early, support claims with evidence, and "
         "acknowledge limitations honestly."),
    _doc("con-abstract", "Writing an abstract", "concept", "methodology",
         "An abstract is a concise standalone summary (often 150–250 words) covering the problem, "
         "approach, key results, and significance. Because it is what most readers and search "
         "engines see first, it should be specific and self-contained, avoid undefined jargon and "
         "citations, and include the main quantitative result. A clear abstract greatly improves "
         "discoverability."),
    _doc("con-systematic-review", "Systematic reviews and meta-analysis", "concept", "methodology",
         "A systematic review answers a focused question using an explicit, reproducible protocol to "
         "find, appraise, and synthesize all relevant studies, often following PRISMA guidelines. A "
         "meta-analysis statistically combines results across studies to estimate an overall effect. "
         "Both reduce bias compared with informal reviews and sit near the top of the evidence "
         "hierarchy."),
    _doc("con-preprints", "Preprints and arXiv", "concept", "methodology",
         "A preprint is a manuscript shared publicly before formal peer review, commonly on servers "
         "like arXiv, bioRxiv, or SSRN. Preprints speed dissemination, establish precedence, and "
         "invite early feedback, though they are not yet peer-reviewed and should be read with that "
         "in mind. Many are later published in journals or conferences."),
    _doc("con-bibliometrics", "Bibliometrics and research impact", "concept", "methodology",
         "Bibliometrics measures research output and influence. The h-index summarizes an author's "
         "productivity and citation impact; journal metrics include the impact factor and "
         "SJR/SCImago quartiles. Altmetrics capture attention beyond citations (downloads, media, "
         "social shares). These indicators are useful but imperfect and should be interpreted in "
         "context, not as sole measures of quality."),
    _doc("con-data-management", "Research data management and FAIR", "concept", "methodology",
         "Research data management plans how data is collected, documented, stored, and shared "
         "throughout a project. The FAIR principles ask that data be Findable, Accessible, "
         "Interoperable, and Reusable — via persistent identifiers, rich metadata, open formats, and "
         "clear licenses. Good data management supports reproducibility, collaboration, and "
         "compliance with funder requirements."),
]


# Combined knowledge base consumed by the RAG retriever. File-based docs from
# kb_docs/ are appended so the KB is extensible without code changes.
_CURATED_DOCS: List[Dict[str, Any]] = _PLATFORM_DOCS + _AI_DOCS + _METHOD_DOCS
KB_DOCUMENTS: List[Dict[str, Any]] = (
    _CURATED_DOCS + _load_folder_docs(existing=_CURATED_DOCS)
)
