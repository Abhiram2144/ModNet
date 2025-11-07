import express from 'express';
import {
  login,
  getChannels,
  createChannel,
  updateChannel,
  deleteChannel,
  getProfileImages,
  addProfileImage,
  deleteProfileImage,
  getUsers,
  getModules,
  getCourses,
  createCourse,
  updateCourse,
  deleteCourse,
} from '../controllers/adminController.js';
import { adminAuthLimiter, adminLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Auth with strict rate limiting
router.post('/admin/login', adminAuthLimiter, login);

// Channels with general admin rate limiting
router.get('/admin/channels', adminLimiter, getChannels);
router.post('/admin/channels', adminLimiter, createChannel);
router.put('/admin/channels/:channelId', adminLimiter, updateChannel);
router.delete('/admin/channels/:channelId', adminLimiter, deleteChannel);

// Profile images with general admin rate limiting
router.get('/admin/profile-images', adminLimiter, getProfileImages);
router.post('/admin/profile-images', adminLimiter, addProfileImage);
router.delete('/admin/profile-images/:imageId', adminLimiter, deleteProfileImage);

// Users with general admin rate limiting
router.get('/admin/users', adminLimiter, getUsers);

// Modules and Courses with general admin rate limiting
router.get('/admin/modules', adminLimiter, getModules);
router.get('/admin/courses', adminLimiter, getCourses);
router.post('/admin/courses', adminLimiter, createCourse);
router.put('/admin/courses/:courseId', adminLimiter, updateCourse);
router.delete('/admin/courses/:courseId', adminLimiter, deleteCourse);

// Health check (no rate limit)
router.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'admin-service' });
});

export default router;
