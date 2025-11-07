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

const router = express.Router();

// Auth
router.post('/admin/login', login);

// Channels
router.get('/admin/channels', getChannels);
router.post('/admin/channels', createChannel);
router.put('/admin/channels/:channelId', updateChannel);
router.delete('/admin/channels/:channelId', deleteChannel);

// Profile images
router.get('/admin/profile-images', getProfileImages);
router.post('/admin/profile-images', addProfileImage);
router.delete('/admin/profile-images/:imageId', deleteProfileImage);

// Users
router.get('/admin/users', getUsers);

// Modules and Courses
router.get('/admin/modules', getModules);
router.get('/admin/courses', getCourses);
router.post('/admin/courses', createCourse);
router.put('/admin/courses/:courseId', updateCourse);
router.delete('/admin/courses/:courseId', deleteCourse);

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'admin-service' });
});

export default router;
