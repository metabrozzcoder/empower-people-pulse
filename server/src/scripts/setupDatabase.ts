import pool from '../config/database';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

async function setupDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Setting up database...');

    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(50),
        avatar TEXT,
        role VARCHAR(20) NOT NULL CHECK (role IN ('Admin', 'HR', 'Guest')),
        status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Pending')),
        department VARCHAR(100),
        organization VARCHAR(100),
        linked_employee VARCHAR(255),
        last_login TIMESTAMP,
        created_date TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_date TIMESTAMP NOT NULL DEFAULT NOW(),
        permissions JSONB DEFAULT '[]'::jsonb,
        username VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        guest_id VARCHAR(50),
        section_access JSONB DEFAULT '[]'::jsonb,
        allowed_sections JSONB DEFAULT '[]'::jsonb
      );
    `);

    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
      CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
    `);

    // Check if admin user exists
    const adminExists = await client.query(
      'SELECT id FROM users WHERE username = $1',
      ['admin']
    );

    if (adminExists.rows.length === 0) {
      // Create default admin user
      const adminId = uuidv4();
      const adminPasswordHash = await bcrypt.hash('admin', 12);
      
      const adminSections = [
        'Dashboard',
        'AI Assistant', 
        'Employees',
        'Projects',
        'Recruitment',
        'Tasks',
        'Scheduling',
        'Attendance',
        'Analytics',
        'Organizations',
        'Chat',
        'User Management',
        'Access Control',
        'Documentation',
        'Security System',
        'Settings'
      ];

      await client.query(`
        INSERT INTO users (
          id, name, email, phone, role, status, department, organization,
          permissions, username, password_hash, allowed_sections, created_date, updated_date
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW()
        )
      `, [
        adminId,
        'Admin User',
        'admin@company.com',
        '+1 (555) 123-4567',
        'Admin',
        'Active',
        'Administration',
        'MediaTech Solutions',
        JSON.stringify(['full_access', 'user_management', 'system_settings']),
        'admin',
        adminPasswordHash,
        JSON.stringify(adminSections)
      ]);

      console.log('✅ Default admin user created');
      console.log('   Username: admin');
      console.log('   Password: admin');
    } else {
      console.log('ℹ️  Admin user already exists');
    }

    console.log('✅ Database setup completed successfully');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  setupDatabase()
    .then(() => {
      console.log('🎉 Database setup finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Setup failed:', error);
      process.exit(1);
    });
}

export default setupDatabase;