import pool from '../config/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { User, CreateUserRequest, UpdateUserRequest, LoginRequest, LoginResponse } from '../models/User';

export class UserService {
  private static JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

  static async createUser(userData: CreateUserRequest): Promise<User> {
    const client = await pool.connect();
    
    try {
      // Check if username or email already exists
      const existingUser = await client.query(
        'SELECT id FROM users WHERE username = $1 OR email = $2',
        [userData.username, userData.email]
      );

      if (existingUser.rows.length > 0) {
        throw new Error('Username or email already exists');
      }

      // Hash password
      const passwordHash = await bcrypt.hash(userData.password, 12);
      const userId = uuidv4();

      const query = `
        INSERT INTO users (
          id, name, email, phone, role, status, department, organization, 
          linked_employee, permissions, username, password_hash, guest_id, 
          section_access, allowed_sections, created_date, updated_date
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW()
        ) RETURNING *
      `;

      const values = [
        userId,
        userData.name,
        userData.email,
        userData.phone || null,
        userData.role,
        'Active',
        userData.department || null,
        userData.organization || null,
        userData.linked_employee || null,
        JSON.stringify(userData.permissions || []),
        userData.username,
        passwordHash,
        userData.guest_id || null,
        JSON.stringify(userData.section_access || []),
        JSON.stringify(userData.allowed_sections || [])
      ];

      const result = await client.query(query, values);
      const user = result.rows[0];

      // Parse JSON fields
      user.permissions = JSON.parse(user.permissions || '[]');
      user.section_access = JSON.parse(user.section_access || '[]');
      user.allowed_sections = JSON.parse(user.allowed_sections || '[]');

      return user;
    } finally {
      client.release();
    }
  }

  static async getAllUsers(): Promise<Omit<User, 'password_hash'>[]> {
    const client = await pool.connect();
    
    try {
      const result = await client.query(`
        SELECT id, name, email, phone, avatar, role, status, department, 
               organization, linked_employee, last_login, created_date, updated_date,
               permissions, username, guest_id, section_access, allowed_sections
        FROM users 
        ORDER BY created_date DESC
      `);

      return result.rows.map(user => ({
        ...user,
        permissions: JSON.parse(user.permissions || '[]'),
        section_access: JSON.parse(user.section_access || '[]'),
        allowed_sections: JSON.parse(user.allowed_sections || '[]')
      }));
    } finally {
      client.release();
    }
  }

  static async getUserById(id: string): Promise<Omit<User, 'password_hash'> | null> {
    const client = await pool.connect();
    
    try {
      const result = await client.query(`
        SELECT id, name, email, phone, avatar, role, status, department, 
               organization, linked_employee, last_login, created_date, updated_date,
               permissions, username, guest_id, section_access, allowed_sections
        FROM users 
        WHERE id = $1
      `, [id]);

      if (result.rows.length === 0) return null;

      const user = result.rows[0];
      return {
        ...user,
        permissions: JSON.parse(user.permissions || '[]'),
        section_access: JSON.parse(user.section_access || '[]'),
        allowed_sections: JSON.parse(user.allowed_sections || '[]')
      };
    } finally {
      client.release();
    }
  }

  static async updateUser(id: string, updates: UpdateUserRequest): Promise<User | null> {
    const client = await pool.connect();
    
    try {
      const setClause = [];
      const values = [];
      let paramCount = 1;

      Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined) {
          if (key === 'permissions' || key === 'section_access' || key === 'allowed_sections') {
            setClause.push(`${key} = $${paramCount}`);
            values.push(JSON.stringify(value));
          } else {
            setClause.push(`${key} = $${paramCount}`);
            values.push(value);
          }
          paramCount++;
        }
      });

      if (setClause.length === 0) {
        throw new Error('No valid fields to update');
      }

      setClause.push(`updated_date = NOW()`);
      values.push(id);

      const query = `
        UPDATE users 
        SET ${setClause.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `;

      const result = await client.query(query, values);
      
      if (result.rows.length === 0) return null;

      const user = result.rows[0];
      user.permissions = JSON.parse(user.permissions || '[]');
      user.section_access = JSON.parse(user.section_access || '[]');
      user.allowed_sections = JSON.parse(user.allowed_sections || '[]');

      return user;
    } finally {
      client.release();
    }
  }

  static async deleteUser(id: string): Promise<boolean> {
    const client = await pool.connect();
    
    try {
      const result = await client.query('DELETE FROM users WHERE id = $1', [id]);
      return result.rowCount > 0;
    } finally {
      client.release();
    }
  }

  static async authenticateUser(credentials: LoginRequest): Promise<LoginResponse | null> {
    const client = await pool.connect();
    
    try {
      const result = await client.query(
        'SELECT * FROM users WHERE username = $1 AND status = $2',
        [credentials.username, 'Active']
      );

      if (result.rows.length === 0) return null;

      const user = result.rows[0];
      const isValidPassword = await bcrypt.compare(credentials.password, user.password_hash);

      if (!isValidPassword) return null;

      // Update last login
      await client.query(
        'UPDATE users SET last_login = NOW() WHERE id = $1',
        [user.id]
      );

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, username: user.username, role: user.role },
        this.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      );

      // Remove password hash from response
      const { password_hash, ...userWithoutPassword } = user;
      
      // Parse JSON fields
      userWithoutPassword.permissions = JSON.parse(userWithoutPassword.permissions || '[]');
      userWithoutPassword.section_access = JSON.parse(userWithoutPassword.section_access || '[]');
      userWithoutPassword.allowed_sections = JSON.parse(userWithoutPassword.allowed_sections || '[]');

      return {
        user: userWithoutPassword,
        token
      };
    } finally {
      client.release();
    }
  }

  static async verifyToken(token: string): Promise<any> {
    try {
      return jwt.verify(token, this.JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }
}