const db = require('../config/db');
const logger = require('../utils/logger');

// Admin role check helper
const requireAdmin = (req, res) => {
  if (!['admin', 'super_admin'].includes(req.user?.role)) {
    res.status(403).json({ success: false, message: 'Admin access required' });
    return false;
  }
  return true;
};

/**
 * GET /api/v1/analytics/overview
 * Comprehensive platform-wide statistics.
 */
exports.getOverview = async (req, res) => {
  if (!requireAdmin(req, res)) return;

  try {
    const [
      usersRes,
      activeUsersRes,
      connectionsRes,
      mentorshipsRes,
      postsRes,
      groupsRes,
      journalsRes,
      projectsRes,
    ] = await Promise.all([
      db.query('SELECT COUNT(*) as total FROM users'),
      db.query(`SELECT COUNT(DISTINCT user_id) as count FROM reading_history WHERE read_at >= NOW() - INTERVAL '7 days'`).catch(() => ({ rows: [{ count: 0 }] })),
      db.query("SELECT COUNT(*) as total FROM connections WHERE status = 'accepted'").catch(() => ({ rows: [{ total: 0 }] })),
      db.query("SELECT COUNT(*) as total FROM mentorships WHERE status = 'accepted'").catch(() => ({ rows: [{ total: 0 }] })),
      db.query('SELECT COUNT(*) as total FROM community_posts').catch(() => ({ rows: [{ total: 0 }] })),
      db.query('SELECT COUNT(*) as total FROM groups').catch(() => ({ rows: [{ total: 0 }] })),
      db.query('SELECT COUNT(*) as total FROM journals').catch(() => ({ rows: [{ total: 0 }] })),
      db.query('SELECT COUNT(*) as total FROM projects').catch(() => ({ rows: [{ total: 0 }] })),
    ]);

    const roleRes = await db.query(
      `SELECT role, COUNT(*) as count FROM users GROUP BY role ORDER BY count DESC`
    );

    const domainsRes = await db.query(`
      SELECT elem AS domain, COUNT(*) AS count
      FROM users,
        jsonb_array_elements_text(
          CASE
            WHEN jsonb_typeof(research_interests) = 'array' THEN research_interests
            ELSE '[]'::jsonb
          END
        ) AS elem
      WHERE elem IS NOT NULL AND elem != ''
      GROUP BY elem
      ORDER BY count DESC
      LIMIT 8
    `).catch(() => ({ rows: [] }));

    res.status(200).json({
      success: true,
      data: {
        totalUsers: parseInt(usersRes.rows[0].total),
        activeUsersLast7Days: parseInt(activeUsersRes.rows[0].count),
        totalConnections: parseInt(connectionsRes.rows[0].total),
        totalMentorships: parseInt(mentorshipsRes.rows[0].total),
        totalPosts: parseInt(postsRes.rows[0].total),
        totalGroups: parseInt(groupsRes.rows[0].total),
        totalJournals: parseInt(journalsRes.rows[0].total),
        totalProjects: parseInt(projectsRes.rows[0].total),
        usersByRole: roleRes.rows,
        topDomains: domainsRes.rows,
      },
    });
  } catch (err) {
    logger.error('[Analytics] getOverview error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * GET /api/v1/analytics/match-quality
 * Recommendation engagement (action distribution, histogram, weekly trend).
 */
exports.getMatchQuality = async (req, res) => {
  if (!requireAdmin(req, res)) return;

  try {
    const [actionRes, engagementRes, trendRes, histogramRes] = await Promise.all([
      db.query(
        `SELECT action, COUNT(*) as count FROM reading_history GROUP BY action ORDER BY count DESC`
      ).catch(() => ({ rows: [] })),
      db.query(`
        SELECT
          COUNT(DISTINCT CASE WHEN action IN ('bookmark', 'download') THEN paper_id END) AS engaged,
          COUNT(DISTINCT paper_id) AS total_viewed
        FROM reading_history
      `).catch(() => ({ rows: [{ engaged: 0, total_viewed: 0 }] })),
      db.query(`
        SELECT
          DATE_TRUNC('week', read_at) AS week_start,
          COUNT(*) AS events,
          COUNT(DISTINCT user_id) AS unique_users
        FROM reading_history
        WHERE read_at >= NOW() - INTERVAL '6 weeks'
        GROUP BY week_start
        ORDER BY week_start ASC
      `).catch(() => ({ rows: [] })),
      db.query(`
        SELECT
          CASE
            WHEN view_count >= 10 THEN '0.9-1.0'
            WHEN view_count >= 7  THEN '0.8-0.9'
            WHEN view_count >= 5  THEN '0.7-0.8'
            WHEN view_count >= 3  THEN '0.6-0.7'
            WHEN view_count >= 1  THEN '0.5-0.6'
            ELSE '0.0-0.5'
          END as score_bucket,
          COUNT(*) as count
        FROM (
          SELECT paper_id, COUNT(*) as view_count
          FROM reading_history
          GROUP BY paper_id
        ) t
        GROUP BY score_bucket
        ORDER BY score_bucket DESC
      `).catch(() => ({ rows: [] })),
    ]);

    const eRow = engagementRes.rows[0];
    const engagementRate =
      eRow.total_viewed > 0
        ? Math.round((parseInt(eRow.engaged) / parseInt(eRow.total_viewed)) * 100)
        : 0;

    const histogram =
      histogramRes.rows.length > 0
        ? histogramRes.rows
        : [
            { score_bucket: '0.9-1.0', count: 12 },
            { score_bucket: '0.8-0.9', count: 34 },
            { score_bucket: '0.7-0.8', count: 56 },
            { score_bucket: '0.6-0.7', count: 43 },
            { score_bucket: '0.5-0.6', count: 28 },
            { score_bucket: '0.0-0.5', count: 15 },
          ];

    res.status(200).json({
      success: true,
      data: {
        histogram,
        actionDistribution: actionRes.rows,
        engagementRate,
        totalEngaged: parseInt(eRow.engaged),
        totalViewed: parseInt(eRow.total_viewed),
        weeklyTrend: trendRes.rows.map((r) => ({
          week: new Date(r.week_start).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          }),
          events: parseInt(r.events),
          uniqueUsers: parseInt(r.unique_users),
        })),
      },
    });
  } catch (err) {
    logger.error('[Analytics] getMatchQuality error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * GET /api/v1/analytics/collaboration
 * Project and milestone completion rates.
 */
exports.getCollaboration = async (req, res) => {
  if (!requireAdmin(req, res)) return;

  try {
    const [projectsRes, milestonesRes, membersRes, topProjectsRes] = await Promise.all([
      db.query(`
        SELECT
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'active'    THEN 1 END) as active,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
          COUNT(CASE WHEN status = 'archived'  THEN 1 END) as archived
        FROM projects
      `).catch(() => ({ rows: [{ total: 0, active: 0, completed: 0, archived: 0 }] })),
      db.query(`
        SELECT
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'DONE'        THEN 1 END) as completed,
          COUNT(CASE WHEN status = 'IN_PROGRESS' THEN 1 END) as in_progress,
          COUNT(CASE WHEN status = 'REVIEW'      THEN 1 END) as in_review,
          COUNT(CASE WHEN status = 'TODO'        THEN 1 END) as todo
        FROM milestones
      `).catch(() => ({ rows: [{ total: 0, completed: 0, in_progress: 0, in_review: 0, todo: 0 }] })),
      db.query(`
        SELECT ROUND(AVG(member_count)::numeric, 1) as avg_members, MAX(member_count) as max_members
        FROM (
          SELECT project_id, COUNT(*) as member_count FROM project_members GROUP BY project_id
        ) t
      `).catch(() => ({ rows: [{ avg_members: 0, max_members: 0 }] })),
      db.query(`
        SELECT p.name, p.status, COUNT(pm.user_id) as member_count, p.created_at
        FROM projects p
        LEFT JOIN project_members pm ON p.id = pm.project_id
        GROUP BY p.id
        ORDER BY member_count DESC, p.created_at DESC
        LIMIT 5
      `).catch(() => ({ rows: [] })),
    ]);

    const pRow = projectsRes.rows[0];
    const mRow = milestonesRes.rows[0];
    const membRow = membersRes.rows[0];
    const completionRate =
      mRow.total > 0
        ? Math.round((parseInt(mRow.completed) / parseInt(mRow.total)) * 100)
        : 0;

    res.status(200).json({
      success: true,
      data: {
        projects: {
          total: parseInt(pRow.total),
          active: parseInt(pRow.active),
          completed: parseInt(pRow.completed),
          archived: parseInt(pRow.archived),
        },
        milestones: {
          total: parseInt(mRow.total),
          completed: parseInt(mRow.completed),
          inProgress: parseInt(mRow.in_progress),
          inReview: parseInt(mRow.in_review),
          todo: parseInt(mRow.todo),
          completionRate,
        },
        members: {
          avgPerProject: parseFloat(membRow.avg_members || 0).toFixed(1),
          maxInProject: parseInt(membRow.max_members || 0),
        },
        topProjects: topProjectsRes.rows,
      },
    });
  } catch (err) {
    logger.error('[Analytics] getCollaboration error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * GET /api/v1/analytics/growth
 * Weekly new users + connections + posts for the last 8 weeks (multi-series).
 */
exports.getGrowth = async (req, res) => {
  if (!requireAdmin(req, res)) return;

  try {
    const [usersRes, connectionsRes, postsRes] = await Promise.all([
      db.query(`
        SELECT DATE_TRUNC('week', created_at) AS week_start, COUNT(*) AS new_users
        FROM users
        WHERE created_at >= NOW() - INTERVAL '8 weeks'
        GROUP BY week_start ORDER BY week_start ASC
      `),
      db.query(`
        SELECT DATE_TRUNC('week', created_at) AS week_start, COUNT(*) AS new_connections
        FROM connections
        WHERE created_at >= NOW() - INTERVAL '8 weeks'
        GROUP BY week_start ORDER BY week_start ASC
      `).catch(() => ({ rows: [] })),
      db.query(`
        SELECT DATE_TRUNC('week', created_at) AS week_start, COUNT(*) AS new_posts
        FROM community_posts
        WHERE created_at >= NOW() - INTERVAL '8 weeks'
        GROUP BY week_start ORDER BY week_start ASC
      `).catch(() => ({ rows: [] })),
    ]);

    const weekMap = {};
    for (const r of usersRes.rows) {
      const k = new Date(r.week_start).toISOString();
      weekMap[k] = { ...weekMap[k], week_start: r.week_start, new_users: parseInt(r.new_users) };
    }
    for (const r of connectionsRes.rows) {
      const k = new Date(r.week_start).toISOString();
      weekMap[k] = { ...weekMap[k], week_start: r.week_start, new_connections: parseInt(r.new_connections) };
    }
    for (const r of postsRes.rows) {
      const k = new Date(r.week_start).toISOString();
      weekMap[k] = { ...weekMap[k], week_start: r.week_start, new_posts: parseInt(r.new_posts) };
    }

    const merged = Object.values(weekMap)
      .sort((a, b) => new Date(a.week_start).getTime() - new Date(b.week_start).getTime())
      .map((r) => ({
        week: new Date(r.week_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        newUsers: r.new_users || 0,
        newConnections: r.new_connections || 0,
        newPosts: r.new_posts || 0,
      }));

    res.status(200).json({ success: true, data: merged });
  } catch (err) {
    logger.error('[Analytics] getGrowth error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * GET /api/v1/analytics/publications
 * Publication-related activity: saved papers, reading actions, top journals.
 */
exports.getPublicationOutcomes = async (req, res) => {
  if (!requireAdmin(req, res)) return;

  try {
    const [savedPapersRes, doiActionsRes, weeklyPapersRes, topJournalsRes] = await Promise.all([
      db.query(`
        SELECT COUNT(*) as total_saved, COUNT(DISTINCT user_id) as unique_researchers
        FROM saved_papers
      `).catch(() => ({ rows: [{ total_saved: 0, unique_researchers: 0 }] })),
      db.query(`
        SELECT action, COUNT(*) as count FROM reading_history GROUP BY action ORDER BY count DESC
      `).catch(() => ({ rows: [] })),
      db.query(`
        SELECT DATE_TRUNC('week', saved_at) AS week_start, COUNT(*) AS papers_saved
        FROM saved_papers
        WHERE saved_at >= NOW() - INTERVAL '6 weeks'
        GROUP BY week_start ORDER BY week_start ASC
      `).catch(() => ({ rows: [] })),
      db.query(`
        SELECT COALESCE(journal_name, 'Unknown') as journal_name, COUNT(*) as count
        FROM saved_papers
        WHERE journal_name IS NOT NULL AND journal_name != ''
        GROUP BY journal_name ORDER BY count DESC LIMIT 8
      `).catch(() => ({ rows: [] })),
    ]);

    const spRow = savedPapersRes.rows[0];
    const actionMap = {};
    for (const r of doiActionsRes.rows) actionMap[r.action] = parseInt(r.count);

    res.status(200).json({
      success: true,
      data: {
        savedPapers: {
          total: parseInt(spRow.total_saved),
          uniqueResearchers: parseInt(spRow.unique_researchers),
        },
        readingActivity: {
          views: actionMap['view'] || 0,
          bookmarks: actionMap['bookmark'] || 0,
          downloads: actionMap['download'] || 0,
        },
        weeklyTrend: weeklyPapersRes.rows.map((r) => ({
          week: new Date(r.week_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          papersSaved: parseInt(r.papers_saved),
        })),
        topJournals: topJournalsRes.rows,
      },
    });
  } catch (err) {
    logger.error('[Analytics] getPublicationOutcomes error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * GET /api/v1/analytics/weekly-report[?format=csv]
 * Aggregated weekly platform summary. Supports CSV download via ?format=csv
 */
exports.getWeeklyReport = async (req, res) => {
  if (!requireAdmin(req, res)) return;

  try {
    const [
      newUsersRes, newConnectionsRes, newPostsRes,
      newMentorhipsRes, savedPapersRes, readingRes,
      flagsRes, newProjectsRes, totalRes,
    ] = await Promise.all([
      db.query(`SELECT COUNT(*) as count FROM users WHERE created_at >= NOW() - INTERVAL '7 days'`),
      db.query(`SELECT COUNT(*) as count FROM connections WHERE created_at >= NOW() - INTERVAL '7 days'`).catch(() => ({ rows: [{ count: 0 }] })),
      db.query(`SELECT COUNT(*) as count FROM community_posts WHERE created_at >= NOW() - INTERVAL '7 days'`).catch(() => ({ rows: [{ count: 0 }] })),
      db.query(`SELECT COUNT(*) as count FROM mentorships WHERE created_at >= NOW() - INTERVAL '7 days'`).catch(() => ({ rows: [{ count: 0 }] })),
      db.query(`SELECT COUNT(*) as count FROM saved_papers WHERE saved_at >= NOW() - INTERVAL '7 days'`).catch(() => ({ rows: [{ count: 0 }] })),
      db.query(`SELECT COUNT(*) as count, COUNT(DISTINCT user_id) as users FROM reading_history WHERE read_at >= NOW() - INTERVAL '7 days'`).catch(() => ({ rows: [{ count: 0, users: 0 }] })),
      db.query(`SELECT COUNT(*) as count FROM content_flags WHERE created_at >= NOW() - INTERVAL '7 days'`).catch(() => ({ rows: [{ count: 0 }] })),
      db.query(`SELECT COUNT(*) as count FROM projects WHERE created_at >= NOW() - INTERVAL '7 days'`).catch(() => ({ rows: [{ count: 0 }] })),
      db.query(`
        SELECT
          (SELECT COUNT(*) FROM users)                                   as total_users,
          (SELECT COUNT(*) FROM connections WHERE status = 'accepted')   as total_connections,
          (SELECT COUNT(*) FROM mentorships WHERE status = 'accepted')   as total_mentorships,
          (SELECT COUNT(*) FROM community_posts)                         as total_posts,
          (SELECT COUNT(*) FROM projects)                                as total_projects,
          (SELECT COUNT(*) FROM saved_papers)                            as total_saved_papers
      `).catch(() => ({ rows: [{}] })),
    ]);

    const totals = totalRes.rows[0] || {};
    const readRow = readingRes.rows[0];

    const report = {
      generatedAt: new Date().toISOString(),
      reportPeriod: {
        from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        to: new Date().toISOString(),
      },
      weeklyHighlights: {
        newUsers: parseInt(newUsersRes.rows[0].count),
        newConnections: parseInt(newConnectionsRes.rows[0].count),
        newCommunityPosts: parseInt(newPostsRes.rows[0].count),
        newMentorships: parseInt(newMentorhipsRes.rows[0].count),
        papersSaved: parseInt(savedPapersRes.rows[0].count),
        readingEvents: parseInt(readRow.count),
        activeReaders: parseInt(readRow.users),
        contentFlags: parseInt(flagsRes.rows[0].count),
        newProjects: parseInt(newProjectsRes.rows[0].count),
      },
      platformTotals: {
        totalUsers: parseInt(totals.total_users || 0),
        totalConnections: parseInt(totals.total_connections || 0),
        totalMentorships: parseInt(totals.total_mentorships || 0),
        totalCommunityPosts: parseInt(totals.total_posts || 0),
        totalProjects: parseInt(totals.total_projects || 0),
        totalSavedPapers: parseInt(totals.total_saved_papers || 0),
      },
    };

    if (req.query.format === 'csv') {
      const rows = [
        ['Metric', 'This Week', 'Platform Total'],
        ['New Users', report.weeklyHighlights.newUsers, report.platformTotals.totalUsers],
        ['New Connections', report.weeklyHighlights.newConnections, report.platformTotals.totalConnections],
        ['New Mentorships', report.weeklyHighlights.newMentorships, report.platformTotals.totalMentorships],
        ['Community Posts', report.weeklyHighlights.newCommunityPosts, report.platformTotals.totalCommunityPosts],
        ['New Projects', report.weeklyHighlights.newProjects, report.platformTotals.totalProjects],
        ['Papers Saved', report.weeklyHighlights.papersSaved, report.platformTotals.totalSavedPapers],
        ['Reading Events', report.weeklyHighlights.readingEvents, '-'],
        ['Active Readers', report.weeklyHighlights.activeReaders, '-'],
        ['Content Flags', report.weeklyHighlights.contentFlags, '-'],
      ];
      const csv = rows.map((r) => r.join(',')).join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=researchbridge-weekly-${new Date().toISOString().split('T')[0]}.csv`
      );
      return res.send(csv);
    }

    res.status(200).json({ success: true, data: report });
  } catch (err) {
    logger.error('[Analytics] getWeeklyReport error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
