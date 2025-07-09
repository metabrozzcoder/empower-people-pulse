import express from 'express';
import { UserService } from '../services/UserService';
import { LoginRequest } from '../models/User';

const router = express.Router();

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const credentials: LoginRequest = req.body;

    if (!credentials.username || !credentials.password) {
      return res.status(400).json({ 
        error: 'Username and password are required' 
      });
    }

    const result = await UserService.authenticateUser(credentials);

    if (!result) {
      return res.status(401).json({ 
        error: 'Invalid username or password' 
      });
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
});

// Logout endpoint (client-side token removal)
router.post('/logout', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Logged out successfully' 
  });
});

export default router;