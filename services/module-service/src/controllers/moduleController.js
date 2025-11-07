import moduleService from '../services/moduleService.js';

// Module controllers
export const getAllModules = async (req, res) => {
  try {
    const modules = await moduleService.getAllModules();
    res.json(modules);
  } catch (error) {
    console.error('Get modules error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getModuleById = async (req, res) => {
  try {
    const { moduleId } = req.params;
    const module = await moduleService.getModuleById(moduleId);
    
    if (!module) {
      return res.status(404).json({ error: 'Module not found' });
    }
    
    res.json(module);
  } catch (error) {
    console.error('Get module error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const createModule = async (req, res) => {
  try {
    const moduleData = req.body;
    const module = await moduleService.createModule(moduleData);
    res.status(201).json(module);
  } catch (error) {
    console.error('Create module error:', error);
    res.status(400).json({ error: error.message });
  }
};

export const updateModule = async (req, res) => {
  try {
    const { moduleId } = req.params;
    const updates = req.body;
    const module = await moduleService.updateModule(moduleId, updates);
    res.json(module);
  } catch (error) {
    console.error('Update module error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const deleteModule = async (req, res) => {
  try {
    const { moduleId } = req.params;
    await moduleService.deleteModule(moduleId);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete module error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getUserModules = async (req, res) => {
  try {
    const { userId } = req.params;
    const modules = await moduleService.getUserModules(userId);
    res.json(modules);
  } catch (error) {
    console.error('Get user modules error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const enrollInModule = async (req, res) => {
  try {
    const { moduleId } = req.params;
    const { userId } = req.body;
    const result = await moduleService.enrollInModule(userId, moduleId);
    res.status(201).json(result);
  } catch (error) {
    console.error('Enroll error:', error);
    res.status(400).json({ error: error.message });
  }
};

export const unenrollFromModule = async (req, res) => {
  try {
    const { moduleId } = req.params;
    const { userId } = req.body;
    await moduleService.unenrollFromModule(userId, moduleId);
    res.json({ success: true });
  } catch (error) {
    console.error('Unenroll error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Course controllers
export const getAllCourses = async (req, res) => {
  try {
    const courses = await moduleService.getAllCourses();
    res.json(courses);
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getCourseById = async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await moduleService.getCourseById(courseId);
    
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    res.json(course);
  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getModulesByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const modules = await moduleService.getModulesByCourse(courseId);
    res.json(modules);
  } catch (error) {
    console.error('Get course modules error:', error);
    res.status(500).json({ error: error.message });
  }
};
