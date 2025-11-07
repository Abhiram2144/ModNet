import { supabase } from '../utils/supabase.js';

class ModuleService {
  /**
   * Get all modules
   */
  async getAllModules() {
    try {
      const { data, error } = await supabase
        .from('modules')
        .select('id, name, code, courseid, courses:courseid (id, name, code)')
        .order('code');

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to fetch modules: ${error.message}`);
    }
  }

  /**
   * Get module by ID
   */
  async getModuleById(moduleId) {
    try {
      const { data, error } = await supabase
        .from('modules')
        .select('id, name, code, courseid, courses:courseid (id, name, code)')
        .eq('id', moduleId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to fetch module: ${error.message}`);
    }
  }

  /**
   * Create new module
   */
  async createModule(moduleData) {
    try {
      const { data, error } = await supabase
        .from('modules')
        .insert([moduleData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to create module: ${error.message}`);
    }
  }

  /**
   * Update module
   */
  async updateModule(moduleId, updates) {
    try {
      const { data, error } = await supabase
        .from('modules')
        .update(updates)
        .eq('id', moduleId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to update module: ${error.message}`);
    }
  }

  /**
   * Delete module
   */
  async deleteModule(moduleId) {
    try {
      const { error } = await supabase
        .from('modules')
        .delete()
        .eq('id', moduleId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      throw new Error(`Failed to delete module: ${error.message}`);
    }
  }

  /**
   * Get user's enrolled modules
   */
  async getUserModules(userId) {
    try {
      const { data, error } = await supabase
        .from('user_modules')
        .select(`moduleid, modules:moduleid (id, name, code, courseid)`)
        .eq('userid', userId);

      if (error) throw error;

      const formatted = data?.map((m) => m.modules) || [];
      return formatted;
    } catch (error) {
      throw new Error(`Failed to fetch user modules: ${error.message}`);
    }
  }

  /**
   * Enroll user in module
   */
  async enrollInModule(userId, moduleId) {
    try {
      const { data, error } = await supabase
        .from('user_modules')
        .insert([{ userid: userId, moduleid: moduleId }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to enroll in module: ${error.message}`);
    }
  }

  /**
   * Unenroll user from module
   */
  async unenrollFromModule(userId, moduleId) {
    try {
      const { error } = await supabase
        .from('user_modules')
        .delete()
        .eq('userid', userId)
        .eq('moduleid', moduleId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      throw new Error(`Failed to unenroll from module: ${error.message}`);
    }
  }

  /**
   * Get all courses
   */
  async getAllCourses() {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('id, name, code')
        .order('code');

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to fetch courses: ${error.message}`);
    }
  }

  /**
   * Get course by ID
   */
  async getCourseById(courseId) {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('id, name, code')
        .eq('id', courseId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to fetch course: ${error.message}`);
    }
  }

  /**
   * Get modules by course
   */
  async getModulesByCourse(courseId) {
    try {
      const { data, error } = await supabase
        .from('modules')
        .select('id, name, code, courseid')
        .eq('courseid', courseId)
        .order('code');

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to fetch course modules: ${error.message}`);
    }
  }
}

export default new ModuleService();
