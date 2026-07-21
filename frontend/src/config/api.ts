/**
 * Centralized API configuration.
 * Reads from NEXT_PUBLIC_API_URL env variable — never hardcoded.
 * Architect rule: Domain integrity, no scattered config.
 */

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000';

// OpenAlex — free scholarly works API (250M+ works, no key required)
// Set NEXT_PUBLIC_OPENALEX_EMAIL for polite-pool priority (recommended)
export const OPENALEX_BASE = 'https://api.openalex.org';
export const OPENALEX_EMAIL = process.env.NEXT_PUBLIC_OPENALEX_EMAIL || 'mostofarezvi1@gmail.com';

export const API = {
  // Auth domain
  auth: {
    register: `${API_BASE}/api/v1/auth/register`,
    login: `${API_BASE}/api/v1/auth/login`,
    verifyOtp: `${API_BASE}/api/v1/auth/verify-otp`,
    resendOtp: `${API_BASE}/api/v1/auth/resend-otp`,
    refresh: `${API_BASE}/api/v1/auth/refresh`,
    verifyEmail: `${API_BASE}/api/v1/auth/verify-email`,
    onboardingComplete: `${API_BASE}/api/v1/auth/onboarding/complete`,
    acceptInvite: `${API_BASE}/api/v1/auth/accept-invite`,
    validateInvite: (token: string) => `${API_BASE}/api/v1/auth/invitation/${token}`,
  },
  // Community domain
  community: {
    posts: `${API_BASE}/api/v1/community/posts`,
    groupFeed: (groupId: string) => `${API_BASE}/api/v1/community/groups/${groupId}/posts`,
    vote: (id: string) => `${API_BASE}/api/v1/community/posts/${id}/vote`,
    react: (id: string) => `${API_BASE}/api/v1/community/posts/${id}/react`,
    comments: (id: string) => `${API_BASE}/api/v1/community/posts/${id}/comments`,
    share: (id: string) => `${API_BASE}/api/v1/community/posts/${id}/share`,
    // Management
    updatePost: (id: string) => `${API_BASE}/api/v1/community/posts/${id}`,
    deletePost: (id: string) => `${API_BASE}/api/v1/community/posts/${id}`,
    updateComment: (id: string) => `${API_BASE}/api/v1/community/comments/${id}`,
    deleteComment: (id: string) => `${API_BASE}/api/v1/community/comments/${id}`,
    upload: `${API_BASE}/api/v1/community/upload`,
    // Threaded comments reuse the `comments` endpoint (optional `parent_id` in body)
    acceptAnswer: (id: string) => `${API_BASE}/api/v1/community/posts/${id}/accept-answer`,
  },
  // Discovery domain
  discovery: {
    search: `${API_BASE}/api/v1/discovery/search`,
    searchDoi: (doi: string) => `${API_BASE}/api/v1/search/doi?doi=${encodeURIComponent(doi)}`,
    save: `${API_BASE}/api/v1/discovery/save`,
    recommendations: `${API_BASE}/api/v1/discovery/recommendations`,
    // Module 2 — unified discovery feed (collaborators + papers + open projects)
    feed: `${API_BASE}/api/v1/discovery/feed`,
  },
  // Blogs domain
  blogs: {
    list: `${API_BASE}/api/v1/blogs`,
    getById: (id: string | number) => `${API_BASE}/api/v1/blogs/${id}`,
    create: `${API_BASE}/api/v1/blogs`,
    adminList: `${API_BASE}/api/v1/blogs/admin`,
    updateStatus: (id: string | number) => `${API_BASE}/api/v1/blogs/${id}/status`,
  },
  // Groups domain
  groups: {
    list: `${API_BASE}/api/v1/groups`,
    create: `${API_BASE}/api/v1/groups`,
    detail: (id: string) => `${API_BASE}/api/v1/groups/${id}`,
    join: (id: string) => `${API_BASE}/api/v1/groups/${id}/join`,
    leave: (id: string) => `${API_BASE}/api/v1/groups/${id}/leave`,
    membership: (id: string) => `${API_BASE}/api/v1/groups/${id}/membership`,
    members: (id: string) => `${API_BASE}/api/v1/groups/${id}/members`,
    handleRequest: (id: string, userId: string) => `${API_BASE}/api/v1/groups/${id}/members/${userId}/request`,
    updateMemberRole: (id: string, userId: string) => `${API_BASE}/api/v1/groups/${id}/members/${userId}/role`,
  },
  // Identity domain
  users: {
    profile: (id: string) => `${API_BASE}/api/v1/users/${id}/profile`,
    history: `${API_BASE}/api/v1/users/me/history`,
  },
  profiles: {
    me: `${API_BASE}/api/v1/profiles/me`,
    avatar: `${API_BASE}/api/v1/profiles/avatar`,
    auditLog: `${API_BASE}/api/v1/profiles/me/audit-log`,
    verifyAuditLog: `${API_BASE}/api/v1/profiles/me/audit-log/verify`,
    achievements: `${API_BASE}/api/v1/profiles/me/achievements`,
  },
  // Admin domain
  admin: {
    invite: `${API_BASE}/api/v1/admin/invite`,
    moderationQueue: `${API_BASE}/api/v1/moderation/queue`,
    moderationStats: `${API_BASE}/api/v1/moderation/stats`,
    auditLogs: `${API_BASE}/api/v1/moderation/audit_logs`,
    resolveFlag: (id: string) => `${API_BASE}/api/v1/moderation/resolve_flag/${id}`,
    journalStatus: (id: string) => `${API_BASE}/api/v1/moderation/journals/${id}/status`,
    // Trust management (Module 10)
    users: (params?: { tier?: string; q?: string; limit?: number }) => {
      const qs = new URLSearchParams();
      if (params?.tier) qs.set('tier', params.tier);
      if (params?.q) qs.set('q', params.q);
      if (params?.limit != null) qs.set('limit', String(params.limit));
      const query = qs.toString();
      return `${API_BASE}/api/v1/admin/users${query ? `?${query}` : ''}`;
    },
    setTrustTier: (id: string) => `${API_BASE}/api/v1/admin/users/${id}/trust-tier`,
    verifyInstitution: (id: string) => `${API_BASE}/api/v1/admin/users/${id}/verify-institution`,
    trustRankRefresh: `${API_BASE}/api/v1/admin/trustrank/refresh`,
  },
  // Researchers domain (seeded from OpenAlex)
  researchers: {
    list: `${API_BASE}/api/v1/researchers`,
    liveSearch: `${API_BASE}/api/v1/researchers/openalex-sync`,
    detail: (id: string) => `${API_BASE}/api/v1/researchers/${id}`,
    works: (id: string) => `${API_BASE}/api/v1/researchers/${id}/works`,
  },
  // Onboarding domain
  onboarding: {
    questions: `${API_BASE}/api/v1/onboarding/questions`,
    questionsFlat: `${API_BASE}/api/v1/onboarding/questions/flat`,
    userInterests: `${API_BASE}/api/v1/onboarding/user-interests`,
    userAnswers: `${API_BASE}/api/v1/onboarding/user-answers`,
  },
  // Dashboard domain
  dashboard: {
    overview: `${API_BASE}/api/v1/dashboard/overview`,
  },
  // Projects & Kanban domain
  projects: {
    list: `${API_BASE}/api/v1/projects`,
    listMilestones: (projectId: string) => `${API_BASE}/api/v1/projects/${projectId}/milestones`,
    createMilestone: (projectId: string) => `${API_BASE}/api/v1/projects/${projectId}/milestones`,
    updateMilestoneStatus: (milestoneId: string) => `${API_BASE}/api/v1/projects/milestones/${milestoneId}/status`,
    getProject: (projectId: string) => `${API_BASE}/api/v1/projects/${projectId}`,
    listVersions: (projectId: string) => `${API_BASE}/api/v1/projects/${projectId}/versions`,
    createVersion: (projectId: string) => `${API_BASE}/api/v1/projects/${projectId}/versions`,
    revertVersion: (projectId: string, versionId: string | number) => `${API_BASE}/api/v1/projects/${projectId}/versions/${versionId}/revert`,
  },
  tasks: {
    listByMilestone: (milestoneId: string | number) => `${API_BASE}/api/v1/tasks?milestone_id=${milestoneId}`,
    create: `${API_BASE}/api/v1/tasks`,
    update: (id: string | number) => `${API_BASE}/api/v1/tasks/${id}`,
    remove: (id: string | number) => `${API_BASE}/api/v1/tasks/${id}`,
  },
  // Connections domain
  connections: {
    request: `${API_BASE}/api/v1/connections/request`,
    list: `${API_BASE}/api/v1/connections`,
    pending: `${API_BASE}/api/v1/connections/pending`,
    respond: (id: string) => `${API_BASE}/api/v1/connections/${id}/respond`,
    remove: (id: string) => `${API_BASE}/api/v1/connections/${id}`,
    status: (recipientId: string) => `${API_BASE}/api/v1/connections/status/${recipientId}`,
  },
  // Notifications domain
  notifications: {
    list: `${API_BASE}/api/v1/notifications`,
    unreadCount: `${API_BASE}/api/v1/notifications/unread-count`,
    markRead: (id: string) => `${API_BASE}/api/v1/notifications/${id}/read`,
    markAllRead: `${API_BASE}/api/v1/notifications/read-all`,
  },
  // Library domain
  library: {
    journals: `${API_BASE}/api/v1/library/journals`,
    categories: `${API_BASE}/api/v1/library/journals/categories`,
    metadata: `${API_BASE}/api/v1/library/metadata`,
    extractPdf: `${API_BASE}/api/v1/library/extract-pdf`,
    // Knowledge Library items (Module 4) — POST create / GET list / semantic search
    items: `${API_BASE}/api/v1/library/items`,
    itemsByType: (type: string) => `${API_BASE}/api/v1/library/items?type=${encodeURIComponent(type)}`,
    searchItems: `${API_BASE}/api/v1/library/search`,
    discover: `${API_BASE}/api/v1/library/discover`,
    downloadItem: (id: string | number) => `${API_BASE}/api/v1/library/items/${id}/download`,
  },
  // Publications / LLM domain
  publications: {
    cite: `${API_BASE}/api/v1/publications/cite`,
    recommendJournals: `${API_BASE}/api/v1/publications/recommend-journals`,
    feedback: `${API_BASE}/api/v1/publications/feedback`,
    scimago: `${API_BASE}/api/v1/publications/scimago`,
    checklist: `${API_BASE}/api/v1/publications/checklist`,
  },
  // Mentorship domain (Module 6)
  mentorship: {
    slots: `${API_BASE}/api/v1/mentorship/slots`,
    slotsByDomain: (domain: string) =>
      `${API_BASE}/api/v1/mentorship/slots${domain ? `?domain=${encodeURIComponent(domain)}` : ''}`,
    recommend: `${API_BASE}/api/v1/mentorship/recommend`,
    request: `${API_BASE}/api/v1/mentorship/request`,
    my: `${API_BASE}/api/v1/mentorship/my`,
    respond: (id: string | number) => `${API_BASE}/api/v1/mentorship/${id}/respond`,
    sessions: (id: string | number) => `${API_BASE}/api/v1/mentorship/${id}/sessions`,
    completeSession: (sessionId: string | number) =>
      `${API_BASE}/api/v1/mentorship/sessions/${sessionId}/complete`,
  },
  // Analytics domain (admin)
  analytics: {
    overview: `${API_BASE}/api/v1/analytics/overview`,
    matchQuality: `${API_BASE}/api/v1/analytics/match-quality`,
    collaboration: `${API_BASE}/api/v1/analytics/collaboration`,
    growth: `${API_BASE}/api/v1/analytics/growth`,
    publications: `${API_BASE}/api/v1/analytics/publications`,
    weeklyReport: `${API_BASE}/api/v1/analytics/weekly-report`,
  },
} as const;
