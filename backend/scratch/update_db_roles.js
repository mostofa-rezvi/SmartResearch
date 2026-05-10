const { pool } = require('../src/config/db');

async function updateRoles() {
  try {
    console.log('Dropping old constraint...');
    await pool.query('ALTER TABLE group_members DROP CONSTRAINT IF EXISTS group_members_role_check');
    
    console.log('Adding new constraint with contributor role...');
    await pool.query("ALTER TABLE group_members ADD CONSTRAINT group_members_role_check CHECK (role IN ('member', 'admin', 'contributor'))");
    
    console.log('Database updated successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Failed to update database:', err);
    process.exit(1);
  }
}

updateRoles();
