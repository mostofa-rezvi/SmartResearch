const db = require('../config/db');

// Resilient helpers — one missing table/column must never zero the whole dashboard.
async function safeCount(sql, params) {
  try {
    const r = await db.query(sql, params);
    return parseInt(r.rows[0]?.count, 10) || 0;
  } catch {
    return 0;
  }
}
async function safeRows(sql, params) {
  try {
    const r = await db.query(sql, params);
    return r.rows;
  } catch {
    return [];
  }
}

exports.getOverview = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Live statistics — every metric reflects the user's real activity.
    const [posts, groups, papersRead, libraryItems, connections, teams, savedVersions] = await Promise.all([
      safeCount('SELECT COUNT(*) AS count FROM community_posts WHERE user_id = $1', [userId]),
      safeCount('SELECT COUNT(*) AS count FROM group_members WHERE user_id = $1', [userId]),
      safeCount('SELECT COUNT(DISTINCT paper_id) AS count FROM reading_history WHERE user_id = $1', [userId]),
      safeCount('SELECT COUNT(*) AS count FROM library_items WHERE user_id = $1', [userId]),
      safeCount(
        "SELECT COUNT(*) AS count FROM connections WHERE status = 'accepted' AND (requester_id = $1 OR recipient_id = $1)",
        [userId]
      ),
      safeCount('SELECT COUNT(*) AS count FROM project_members WHERE user_id = $1', [userId]),
      safeCount(
        `SELECT COUNT(*) AS count FROM document_versions dv
           JOIN project_members pm ON pm.project_id = dv.project_id
          WHERE pm.user_id = $1`,
        [userId]
      ),
    ]);

    // Impact = invited-profile impact score, else the user's earned reputation.
    const userRows = await safeRows(
      `SELECT COALESCE(iup.impact_score, u.reputation_points, 0) AS impact, u.research_interests
         FROM users u
         LEFT JOIN invited_user_profiles iup ON u.id = iup.user_id
        WHERE u.id = $1`,
      [userId]
    );
    const impactScore = Number(userRows[0]?.impact) || 0;
    const interests = userRows[0]?.research_interests;

    // This-week momentum — new items in the last 7 days (drives the card deltas).
    const [libraryItems7d, connections7d, teams7d, posts7d] = await Promise.all([
      safeCount("SELECT COUNT(*) AS count FROM library_items WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '7 days'", [userId]),
      safeCount(
        "SELECT COUNT(*) AS count FROM connections WHERE status = 'accepted' AND (requester_id = $1 OR recipient_id = $1) AND updated_at >= NOW() - INTERVAL '7 days'",
        [userId]
      ),
      safeCount(
        `SELECT COUNT(*) AS count FROM projects p JOIN project_members pm ON pm.project_id = p.id
          WHERE pm.user_id = $1 AND p.created_at >= NOW() - INTERVAL '7 days'`,
        [userId]
      ),
      safeCount("SELECT COUNT(*) AS count FROM community_posts WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '7 days'", [userId]),
    ]);

    // 2. Recent activity — merged across every workspace the user touches.
    const activity = [];
    (await safeRows(
      "SELECT title, created_at FROM community_posts WHERE user_id = $1 ORDER BY created_at DESC LIMIT 4",
      [userId]
    )).forEach((r) => activity.push({ type: 'post', title: `You posted “${r.title}”`, time: r.created_at, href: '/community' }));

    (await safeRows(
      "SELECT title, item_type, created_at FROM library_items WHERE user_id = $1 ORDER BY created_at DESC LIMIT 4",
      [userId]
    )).forEach((r) =>
      activity.push({
        type: 'library',
        title: `Added ${String(r.item_type || 'item').replace('_', ' ')} “${r.title}”`,
        time: r.created_at,
        href: '/library',
      })
    );

    (await safeRows(
      `SELECT p.id, p.name, p.created_at FROM projects p
         JOIN project_members pm ON pm.project_id = p.id
        WHERE pm.user_id = $1 ORDER BY p.created_at DESC LIMIT 3`,
      [userId]
    )).forEach((r) => activity.push({ type: 'team', title: `Joined team “${r.name}”`, time: r.created_at, href: `/teams/${r.id}` }));

    (await safeRows(
      `SELECT dv.version_name, dv.created_at FROM document_versions dv
         JOIN project_members pm ON pm.project_id = dv.project_id
        WHERE pm.user_id = $1 ORDER BY dv.created_at DESC LIMIT 3`,
      [userId]
    )).forEach((r) => activity.push({ type: 'version', title: `Saved version “${r.version_name}”`, time: r.created_at, href: '/teams' }));

    (await safeRows(
      `SELECT u.name, c.updated_at FROM connections c
         JOIN users u ON u.id = CASE WHEN c.requester_id = $1 THEN c.recipient_id ELSE c.requester_id END
        WHERE c.status = 'accepted' AND (c.requester_id = $1 OR c.recipient_id = $1)
        ORDER BY c.updated_at DESC LIMIT 3`,
      [userId]
    )).forEach((r) => activity.push({ type: 'connection', title: `Connected with ${r.name}`, time: r.updated_at, href: '/researchers' }));

    activity.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    const recentActivity = activity.slice(0, 6);
    if (recentActivity.length === 0) {
      recentActivity.push({ type: 'system', title: 'Welcome to your Research Lab!', time: new Date().toISOString() });
    }

    // 3. Suggested reading — approved blogs matching the user's primary interest.
    const primaryInterest =
      Array.isArray(interests) && interests.length > 0
        ? interests[0]
        : interests && Array.isArray(interests.interests) && interests.interests.length > 0
        ? interests.interests[0]
        : 'Research';
    let recommendations = await safeRows(
      `SELECT b.id, b.title, u.name AS author, b.category FROM blogs b
         JOIN users u ON b.author_id = u.id
        WHERE b.status = 'approved' AND b.category ILIKE $1
        ORDER BY b.created_at DESC LIMIT 3`,
      [`%${primaryInterest}%`]
    );
    if (recommendations.length === 0) {
      recommendations = await safeRows(
        `SELECT b.id, b.title, u.name AS author, b.category FROM blogs b
           JOIN users u ON b.author_id = u.id
          WHERE b.status = 'approved' ORDER BY b.created_at DESC LIMIT 3`,
        []
      );
    }

    res.status(200).json({
      success: true,
      data: {
        stats: { posts, groups, papersRead, impactScore, libraryItems, connections, teams, savedVersions },
        trend: { libraryItems: libraryItems7d, connections: connections7d, teams: teams7d, posts: posts7d },
        recentActivity,
        recommendations,
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard overview:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
