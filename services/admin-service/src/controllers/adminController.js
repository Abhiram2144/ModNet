import adminService from '../services/adminService.js';
import { config } from '../config/config.js';

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await adminService.login(email, password, config.admin.password);
    res.json(result);
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(401).json({ error: error.message });
  }
};

// Channel controllers
export const getChannels = async (req, res) => {
  try {
    const channels = await adminService.getChannels();
    res.json(channels);
  } catch (error) {
    console.error('Get channels error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const createChannel = async (req, res) => {
  try {
    const channelData = req.body;
    const channel = await adminService.createChannel(channelData);
    res.status(201).json(channel);
  } catch (error) {
    console.error('Create channel error:', error);
    res.status(400).json({ error: error.message });
  }
};

export const updateChannel = async (req, res) => {
  try {
    const { channelId } = req.params;
    const updates = req.body;
    const channel = await adminService.updateChannel(channelId, updates);
    res.json(channel);
  } catch (error) {
    console.error('Update channel error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const deleteChannel = async (req, res) => {
  try {
    const { channelId } = req.params;
    await adminService.deleteChannel(channelId);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete channel error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Profile image controllers
export const getProfileImages = async (req, res) => {
  try {
    const images = await adminService.getProfileImages();
    res.json(images);
  } catch (error) {
    console.error('Get profile images error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const addProfileImage = async (req, res) => {
  try {
    const imageData = req.body;
    const image = await adminService.addProfileImage(imageData);
    res.status(201).json(image);
  } catch (error) {
    console.error('Add profile image error:', error);
    res.status(400).json({ error: error.message });
  }
};

export const deleteProfileImage = async (req, res) => {
  try {
    const { imageId } = req.params;
    await adminService.deleteProfileImage(imageId);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete profile image error:', error);
    res.status(500).json({ error: error.message });
  }
};

// User management controllers
export const getUsers = async (req, res) => {
  try {
    const users = await adminService.getUsers();
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Module/Course controllers
export const getModules = async (req, res) => {
  try {
    const modules = await adminService.getModules();
    res.json(modules);
  } catch (error) {
    console.error('Get modules error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getCourses = async (req, res) => {
  try {
    const courses = await adminService.getCourses();
    res.json(courses);
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const createCourse = async (req, res) => {
  try {
    const courseData = req.body;
    const course = await adminService.createCourse(courseData);
    res.status(201).json(course);
  } catch (error) {
    console.error('Create course error:', error);
    res.status(400).json({ error: error.message });
  }
};

export const updateCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const updates = req.body;
    const course = await adminService.updateCourse(courseId, updates);
    res.json(course);
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const deleteCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    await adminService.deleteCourse(courseId);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({ error: error.message });
  }
};
