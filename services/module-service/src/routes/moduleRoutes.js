import express from 'express';
import {
  getAllModules,
  getModuleById,
  createModule,
  updateModule,
  deleteModule,
  getUserModules,
  enrollInModule,
  unenrollFromModule,
  getAllCourses,
  getCourseById,
  getModulesByCourse,
} from '../controllers/moduleController.js';

const router = express.Router();

// Module routes
router.get('/modules', getAllModules);
router.get('/modules/:moduleId', getModuleById);
router.post('/modules', createModule);
router.put('/modules/:moduleId', updateModule);
router.delete('/modules/:moduleId', deleteModule);

// User module enrollment routes
router.get('/modules/user/:userId', getUserModules);
router.post('/modules/:moduleId/enroll', enrollInModule);
router.delete('/modules/:moduleId/unenroll', unenrollFromModule);

// Course routes
router.get('/courses', getAllCourses);
router.get('/courses/:courseId', getCourseById);
router.get('/courses/:courseId/modules', getModulesByCourse);

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'module-service' });
});

export default router;
