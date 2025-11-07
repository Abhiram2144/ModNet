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

const router = express.Router();

// Auth routes
router.post('/login', login);
router.post('/register', register);
router.post('/logout', logout);
router.get('/session', getSession);

// Profile routes
router.get('/profile/:userId', getProfile);
router.put('/profile/:userId', updateProfile);

// User modules
router.get('/modules/:studentId', getUserModules);

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'auth-service' });
});

export default router;
