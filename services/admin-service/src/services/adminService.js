import { supabase } from '../utils/supabase.js';

class AdminService {
  /**
   * Admin login
   */
  async login(email, password, adminPassword) {
    try {
      // Verify admin password from config
      if (password !== adminPassword) {
        throw new Error('Invalid admin credentials');
      }

      // Create session
      return {
        success: true,
        email,
        role: 'admin',
      };
    } catch (error) {
      throw new Error(`Admin login failed: ${error.message}`);
    }
  }

  /**
   * Get all channels
   */
  async getChannels() {
    try {
      const { data, error } = await supabase
        .from('channels')
        .select('*')
        .order('createdat', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw new Error(`Failed to fetch channels: ${error.message}`);
    }
  }

  /**
   * Create channel
   */
  async createChannel(channelData) {
    try {
      const { data, error } = await supabase
        .from('channels')
        .insert([channelData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to create channel: ${error.message}`);
    }
  }

  /**
   * Update channel
   */
  async updateChannel(channelId, updates) {
    try {
      const { data, error } = await supabase
        .from('channels')
        .update(updates)
        .eq('id', channelId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to update channel: ${error.message}`);
    }
  }

  /**
   * Delete channel
   */
  async deleteChannel(channelId) {
    try {
      const { error } = await supabase
        .from('channels')
        .delete()
        .eq('id', channelId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      throw new Error(`Failed to delete channel: ${error.message}`);
    }
  }

  /**
   * Get all profile images
   */
  async getProfileImages() {
    try {
      const { data, error } = await supabase
        .from('profileimages')
        .select('*')
        .order('id');

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw new Error(`Failed to fetch profile images: ${error.message}`);
    }
  }

  /**
   * Add profile image
   */
  async addProfileImage(imageData) {
    try {
      const { data, error } = await supabase
        .from('profileimages')
        .insert([imageData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to add profile image: ${error.message}`);
    }
  }

  /**
   * Delete profile image
   */
  async deleteProfileImage(imageId) {
    try {
      const { error } = await supabase
        .from('profileimages')
        .delete()
        .eq('id', imageId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      throw new Error(`Failed to delete profile image: ${error.message}`);
    }
  }

  /**
   * Get all users/students
   */
  async getUsers() {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('id, displayname, email, profileimage, canreview, courseid')
        .order('displayname');

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw new Error(`Failed to fetch users: ${error.message}`);
    }
  }

  /**
   * Get all modules (admin view)
   */
  async getModules() {
    try {
      const { data, error } = await supabase
        .from('modules')
        .select('id, name, code, courseid, courses:courseid (name, code)')
        .order('code');

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw new Error(`Failed to fetch modules: ${error.message}`);
    }
  }

  /**
   * Get all courses (admin view)
   */
  async getCourses() {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('code');

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw new Error(`Failed to fetch courses: ${error.message}`);
    }
  }

  /**
   * Create course
   */
  async createCourse(courseData) {
    try {
      const { data, error } = await supabase
        .from('courses')
        .insert([courseData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to create course: ${error.message}`);
    }
  }

  /**
   * Update course
   */
  async updateCourse(courseId, updates) {
    try {
      const { data, error } = await supabase
        .from('courses')
        .update(updates)
        .eq('id', courseId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to update course: ${error.message}`);
    }
  }

  /**
   * Delete course
   */
  async deleteCourse(courseId) {
    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      throw new Error(`Failed to delete course: ${error.message}`);
    }
  }
}

export default new AdminService();
