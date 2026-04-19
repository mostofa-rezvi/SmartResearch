/**
 * Centralized API configuration.
 * Reads from NEXT_PUBLIC_API_URL env variable — never hardcoded.
 * Architect rule: Domain integrity, no scattered config.
 */

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const API = {
  // Auth domain
  auth: {
    register:          `${API_BASE}/api/v1/auth/register`,
    login:             `${API_BASE}/api/v1/auth/login`,
    verifyOtp:         `${API_BASE}/api/v1/auth/verify-otp`,
    refresh:           `${API_BASE}/api/v1/auth/refresh`,
    verifyEmail:       `${API_BASE}/api/v1/auth/verify-email`,
    onboardingComplete:`${API_BASE}/api/v1/auth/onboarding/complete`,
    acceptInvite:      `${API_BASE}/api/v1/auth/accept-invite`,
    validateInvite:    (token: string) => `${API_BASE}/api/v1/auth/invitation/${token}`,
  },
  // Community domain
  community: {
    posts:             `${API_BASE}/api/v1/community/posts`,
    vote:              (id: string) => `${API_BASE}/api/v1/community/posts/${id}/vote`,
  },
  // Discovery domain
  discovery: {
    search:            `${API_BASE}/api/v1/discovery/search`,
    save:              `${API_BASE}/api/v1/discovery/save`,
  },
  // Library domain
  library: {
    journals:          `${API_BASE}/api/v1/journals`,
    categories:        `${API_BASE}/api/v1/journals/categories`,
  },
  // Groups domain
  groups: {
    list:              `${API_BASE}/api/v1/groups`,
    create:            `${API_BASE}/api/v1/groups`,
    join:              (id: string) => `${API_BASE}/api/v1/groups/${id}/join`,
  },
  // Identity domain
  users: {
    profile:           (id: string) => `${API_BASE}/api/v1/users/${id}/profile`,
  },
  // Admin domain
  admin: {
    invite:            `${API_BASE}/api/v1/admin/invite`,
    moderationQueue:   `${API_BASE}/api/v1/moderation/queue`,
    moderationStats:   `${API_BASE}/api/v1/moderation/stats`,
    auditLogs:         `${API_BASE}/api/v1/moderation/audit_logs`,
    resolveFlag:       (id: string) => `${API_BASE}/api/v1/moderation/resolve_flag/${id}`,
    journalStatus:     (id: string) => `${API_BASE}/api/v1/moderation/journals/${id}/status`,
  },
} as const;
