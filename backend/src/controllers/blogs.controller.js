const db = require('../config/db');

exports.getApprovedBlogs = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT b.id, b.title, b.excerpt, b.category, b.image_url, b.created_at, u.name as author
      FROM blogs b
      JOIN users u ON b.author_id = u.id
      WHERE b.status = 'approved'
      ORDER BY b.created_at DESC
    `);
    
    res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching blogs:', error);
    res.status(500).json({ success: false, message: 'Server error fetching blogs' });
  }
};

exports.getBlogById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(`
      SELECT b.*, u.name as author 
      FROM blogs b
      JOIN users u ON b.author_id = u.id
      WHERE b.id = $1 AND b.status = 'approved'
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Blog not found or pending approval' });
    }

    res.status(200).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching blog:', error);
    res.status(500).json({ success: false, message: 'Server error fetching blog' });
  }
};

exports.createBlog = async (req, res) => {
  try {
    const { title, excerpt, content, category, image_url } = req.body;
    const author_id = req.user.id;

    if (!title || !content || !category) {
      return res.status(400).json({ success: false, message: 'Title, content, and category are required' });
    }

    const defaultImage = image_url || 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=1000';

    const result = await db.query(
      `INSERT INTO blogs (title, excerpt, content, author_id, category, image_url, status) 
       VALUES ($1, $2, $3, $4, $5, $6, 'pending') RETURNING id`,
      [title, excerpt, content, author_id, category, defaultImage]
    );

    res.status(201).json({
      success: true,
      message: 'Blog submitted successfully and is pending admin approval',
      data: { id: result.rows[0].id }
    });
  } catch (error) {
    console.error('Error creating blog:', error);
    res.status(500).json({ success: false, message: 'Server error creating blog' });
  }
};

exports.getAdminBlogs = async (req, res) => {
  try {
    // Only super_admin or admin can access
    if (req.user.role !== 'super_admin' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized. Admins only.' });
    }

    const result = await db.query(`
      SELECT b.id, b.title, b.category, b.status, b.created_at, u.name as author
      FROM blogs b
      JOIN users u ON b.author_id = u.id
      ORDER BY b.created_at DESC
    `);

    res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching admin blogs:', error);
    res.status(500).json({ success: false, message: 'Server error fetching admin blogs' });
  }
};

exports.updateBlogStatus = async (req, res) => {
  try {
    // Only super_admin or admin can access
    if (req.user.role !== 'super_admin' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized. Admins only.' });
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const result = await db.query(
      `UPDATE blogs SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, status`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }

    res.status(200).json({
      success: true,
      message: `Blog status updated to ${status}`,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating blog status:', error);
    res.status(500).json({ success: false, message: 'Server error updating blog status' });
  }
};
