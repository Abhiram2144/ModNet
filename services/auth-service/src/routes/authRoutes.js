import express from 'express';
import {
  login,
  register,
  logout,
  getSession,
  getProfile,
  updateProfile,
  getUserModules,
} from '../controllers/authController.js';
import { authLimiter, generalLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Auth routes with strict rate limiting
router.post('/login', authLimiter, login);
router.post('/register', authLimiter, register);
router.post('/logout', generalLimiter, logout);
router.get('/session', generalLimiter, getSession);

// Profile routes with general rate limiting
router.get('/profile/:userId', generalLimiter, getProfile);
router.put('/profile/:userId', generalLimiter, updateProfile);

// User modules with general rate limiting
router.get('/modules/:studentId', generalLimiter, getUserModules);

// Health check (no rate limit)
router.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'auth-service' });
});

export default router;
