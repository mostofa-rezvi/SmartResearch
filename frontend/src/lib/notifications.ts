// Shared notification presentation + routing — used by the bell and the
// /notifications page so both stay consistent as new types are added.

export interface AppNotification {
  id: number;
  type: string;
  title: string;
  body: string | null;
  meta: Record<string, any>;
  is_read: boolean;
  created_at: string;
}

type NotifMeta = { icon: string; color: string; label: string };

const NOTIF_META: Record<string, NotifMeta> = {
  connection_request:     { icon: "🤝", color: "bg-indigo-500/10 text-indigo-500", label: "Connection Request" },
  connection_accepted:    { icon: "✅", color: "bg-emerald-500/10 text-emerald-500", label: "Connection Accepted" },
  collaboration_request:  { icon: "🧪", color: "bg-violet-500/10 text-violet-500", label: "Collaboration Proposal" },
  collaboration_accepted: { icon: "🎉", color: "bg-emerald-500/10 text-emerald-500", label: "Collaboration Accepted" },
  collaboration_declined: { icon: "🚫", color: "bg-red-500/10 text-red-500", label: "Collaboration Update" },
  team_invite:            { icon: "👥", color: "bg-primary/10 text-primary dark:text-white", label: "Team Invite" },
  workspace_activity:     { icon: "📋", color: "bg-primary/10 text-primary dark:text-white", label: "Workspace Activity" },
  forum_reply:            { icon: "💬", color: "bg-purple-500/10 text-purple-500", label: "Forum Reply" },
  publication_update:     { icon: "📄", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400", label: "Publication" },
  collaborator_match:     { icon: "🔗", color: "bg-blue-500/10 text-blue-500", label: "Collaborator Match" },
  match:                  { icon: "🔍", color: "bg-blue-500/10 text-blue-500", label: "New Match" },
  mentorship_request:     { icon: "🎓", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400", label: "Mentorship Request" },
  mentorship_accepted:    { icon: "🎓", color: "bg-emerald-500/10 text-emerald-500", label: "Mentorship Accepted" },
  mentorship_rejected:    { icon: "🎓", color: "bg-red-500/10 text-red-500", label: "Mentorship Update" },
  group_join_request:     { icon: "👋", color: "bg-blue-500/10 text-blue-500", label: "Group Request" },
  group_request_approved: { icon: "🎉", color: "bg-emerald-500/10 text-emerald-500", label: "Group Approved" },
  group_request_rejected: { icon: "🚫", color: "bg-red-500/10 text-red-500", label: "Group Update" },
  system:                 { icon: "🔔", color: "bg-slate-500/10 text-slate-500", label: "System" },
};

export function notifMeta(type: string): NotifMeta {
  return NOTIF_META[type] || { icon: "🔔", color: "bg-slate-100 dark:bg-slate-800 text-slate-500", label: type.replace(/_/g, " ") };
}

/** Where clicking a notification should take the user, based on type + meta. */
export function notificationLink(n: AppNotification): string {
  const m = n.meta || {};
  switch (n.type) {
    case "connection_request":
    case "connection_accepted":
      return m.from_user_id ? `/profile/${m.from_user_id}` : "/researchers";
    case "collaboration_request":
    case "collaboration_declined":
      return "/teams";
    case "collaboration_accepted":
    case "team_invite":
    case "workspace_activity":
      return m.project_id ? `/teams/${m.project_id}` : "/teams";
    case "forum_reply":
      return m.post_id ? `/community/${m.post_id}` : "/community";
    case "publication_update":
      return "/library";
    case "collaborator_match":
    case "match":
      return "/researchers";
    case "mentorship_request":
    case "mentorship_accepted":
    case "mentorship_rejected":
      return "/mentorship";
    case "group_join_request":
    case "group_request_approved":
    case "group_request_rejected":
      return m.group_id ? `/groups/${m.group_id}` : "/groups";
    default:
      return "/notifications";
  }
}
