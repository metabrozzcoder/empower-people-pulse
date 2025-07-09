import express from 'express';
import { UserService } from '../services/UserService';
import { CreateUserRequest, UpdateUserRequest } from '../models/User';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get all users (Admin and HR only)
router.get('/', authenticateToken, requireRole(['Admin', 'HR']), async (req, res) => {
  try {
    const users = await UserService.getAllUsers();
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch users' 
    });
  }
});

// Get user by ID
router.get('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    
    // Users can only access their own data unless they're Admin/HR
    if (req.user.userId !== id && !['Admin', 'HR'].includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Access denied' 
      });
    }

    const user = await UserService.getUserById(id);
    
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found' 
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch user' 
    });
  }
});

// Create new user (Admin only)
router.post('/', authenticateToken, requireRole(['Admin']), async (req, res) => {
  try {
    const userData: CreateUserRequest = req.body;

    // Validate required fields
    if (!userData.name || !userData.email || !userData.username || !userData.password || !userData.role) {
      return res.status(400).json({ 
        error: 'Missing required fields: name, email, username, password, role' 
      });
    }

    const user = await UserService.createUser(userData);
    
    // Remove password hash from response
    const { password_hash, ...userResponse } = user;

    res.status(201).json({
      success: true,
      data: userResponse
    });
  } catch (error) {
    console.error('Create user error:', error);
    
    if (error.message === 'Username or email already exists') {
      return res.status(409).json({ 
        error: error.message 
      });
    }

    res.status(500).json({ 
      error: 'Failed to create user' 
    });
  }
});

// Update user (Admin or own profile)
router.put('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const updates: UpdateUserRequest = req.body;

    // Users can only update their own profile unless they're Admin
    if (req.user.userId !== id && req.user.role !== 'Admin') {
      return res.status(403).json({ 
        error: 'Access denied' 
      });
    }

    // Non-admin users cannot change role or status
    if (req.user.role !== 'Admin') {
      delete updates.role;
      delete updates.status;
      delete updates.permissions;
    }

    const user = await UserService.updateUser(id, updates);
    
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found' 
      });
    }

    // Remove password hash from response
    const { password_hash, ...userResponse } = user;

    res.json({
      success: true,
      data: userResponse
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ 
      error: 'Failed to update user' 
    });
  }
});

// Delete user (Admin only)
router.delete('/:id', authenticateToken, requireRole(['Admin']), async (req, res) => {
  try {
    const { id } = req.params;
    
    const success = await UserService.deleteUser(id);
    
    if (!success) {
      return res.status(404).json({ 
        error: 'User not found' 
      });
    }

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ 
      error: 'Failed to delete user' 
    });
  }
});

export default router;