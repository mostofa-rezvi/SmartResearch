const db = require('../config/db');

exports.getOverview = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Get Stats (Community posts by user, Groups joined, Papers read)
    const postsResult = await db.query('SELECT COUNT(*) as count FROM community_posts WHERE user_id = $1', [userId]);
    const groupsResult = await db.query('SELECT COUNT(*) as count FROM group_members WHERE user_id = $1', [userId]);
    const papersResult = await db.query('SELECT COUNT(DISTINCT paper_id) as count FROM reading_history WHERE user_id = $1', [userId]);
    const userResult = await db.query(`
      SELECT u.research_interests, iup.impact_score 
      FROM users u 
      LEFT JOIN invited_user_profiles iup ON u.id = iup.user_id 
      WHERE u.id = $1
    `, [userId]);

    const postCount = parseInt(postsResult.rows[0].count) || 0;
    const groupCount = parseInt(groupsResult.rows[0].count) || 0;
    const papersReadCount = parseInt(papersResult.rows[0].count) || 0;
    const impactScore = userResult.rows[0].impact_score || 0;
    const interests = userResult.rows[0].research_interests || [];


    // 2. Recent Activity (Latest 5 posts/comments)
    const recentActivityQuery = `
      SELECT id, title, created_at, 'post' as type 
      FROM community_posts 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT 3
    `;
    const activityResult = await db.query(recentActivityQuery, [userId]);
    const activities = activityResult.rows.map(row => ({
      type: row.type,
      title: `You started: ${row.title}`,
      time: row.created_at
    }));

    if (activities.length === 0) {
      activities.push({
        type: 'system',
        title: 'Welcome to your Research Lab!',
        time: new Date().toISOString()
      });
    }

    // 3. Tailored Recommendations (Based on user interests)
    // For now, if no ML is strictly required, we query the journals DB using their interests
    // Or we just mock 3 high-quality journals based on their primary interest
    const primaryInterest = interests.length > 0 ? interests[0] : 'Research';
    const recommendationsQuery = `
      SELECT b.id, b.title, u.name as author, b.category 
      FROM blogs b
      JOIN users u ON b.author_id = u.id
      WHERE b.status = 'approved' AND b.category ILIKE $1 
      ORDER BY b.created_at DESC 
      LIMIT 3
    `;
    const recommendationsResult = await db.query(recommendationsQuery, [`%${primaryInterest}%`]);
    let recommendations = recommendationsResult.rows;

    if (recommendations.length === 0) {
      // Fallback
      const fallbackQuery = `
        SELECT b.id, b.title, u.name as author, b.category 
        FROM blogs b
        JOIN users u ON b.author_id = u.id
        WHERE b.status = 'approved'
        ORDER BY b.created_at DESC 
        LIMIT 3
      `;
      const fallbackResult = await db.query(fallbackQuery);
      recommendations = fallbackResult.rows;
    }

    res.status(200).json({
      success: true,
      data: {
        stats: {
          posts: postCount,
          groups: groupCount,
          impactScore: impactScore,
          papersRead: papersReadCount
        },
        recentActivity: activities,
        recommendations: recommendations
      }
    });

  } catch (error) {
    console.error('Error fetching dashboard overview:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
