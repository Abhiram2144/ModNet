import { supabaseAnon, supabase } from '../utils/supabase.js';
import jwt from 'jsonwebtoken';
import { config } from '../config/config.js';

class AuthService {
  /**
   * User login with email and password
   */
  async login(email, password) {
    try {
      const { data, error } = await supabaseAnon.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Get user profile from students table
      const { data: profile, error: profileError } = await supabase
        .from('students')
        .select('id, displayname, email, profileimage, canreview, review, suggestion, courseid, userid')
        .eq('userid', data.user.id)
        .maybeSingle();

      if (profileError) {
        console.warn('Profile fetch error:', profileError);
      }

      // Generate custom JWT token
      const token = jwt.sign(
        {
          userId: data.user.id,
          email: data.user.email,
          studentId: profile?.id,
        },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );

      return {
        user: data.user,
        session: data.session,
        profile,
        token,
      };
    } catch (error) {
      throw new Error(`Login failed: ${error.message}`);
    }
  }

  /**
   * User registration
   */
  async register(email, password, displayName) {
    try {
      // Create auth user
      const { data, error } = await supabaseAnon.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      // Create student profile
      if (data.user) {
        const { data: profile, error: profileError } = await supabase
          .from('students')
          .insert([
            {
              userid: data.user.id,
              email: email,
              displayname: displayName,
              profileimage: 'default.png',
            },
          ])
          .select()
          .single();

        if (profileError) {
          console.error('Profile creation error:', profileError);
          // Continue even if profile creation fails
        }

        return {
          user: data.user,
          profile,
        };
      }

      return { user: data.user };
    } catch (error) {
      throw new Error(`Registration failed: ${error.message}`);
    }
  }

  /**
   * User logout
   */
  async logout() {
    try {
      const { error } = await supabaseAnon.auth.signOut();
      if (error) throw error;
      return { success: true };
    } catch (error) {
      throw new Error(`Logout failed: ${error.message}`);
    }
  }

  /**
   * Get current session
   */
  async getSession(accessToken) {
    try {
      const { data, error } = await supabaseAnon.auth.getUser(accessToken);
      if (error) throw error;

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('students')
        .select('id, displayname, email, profileimage, canreview, review, suggestion, courseid, userid')
        .eq('userid', data.user.id)
        .maybeSingle();

      if (profileError) {
        console.warn('Profile fetch error:', profileError);
      }

      return {
        user: data.user,
        profile,
      };
    } catch (error) {
      throw new Error(`Session fetch failed: ${error.message}`);
    }
  }

  /**
   * Get user profile
   */
  async getProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('id, displayname, email, profileimage, canreview, review, suggestion, courseid, userid')
        .eq('userid', userId)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Profile fetch failed: ${error.message}`);
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userId, updates) {
    try {
      const { data, error } = await supabase
        .from('students')
        .update(updates)
        .eq('userid', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Profile update failed: ${error.message}`);
    }
  }

  /**
   * Get user modules (for preloading)
   */
  async getUserModules(studentId) {
    try {
      const { data, error } = await supabase
        .from('user_modules')
        .select(`moduleid, modules:moduleid (id, name, code)`)
        .eq('userid', studentId);

      if (error) throw error;

      const formatted = data?.map((m) => m.modules) || [];
      return formatted;
    } catch (error) {
      throw new Error(`Modules fetch failed: ${error.message}`);
    }
  }
}

export default new AuthService();
