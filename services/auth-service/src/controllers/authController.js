import authService from '../services/authService.js';

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await authService.login(email, password);
    res.json(result);
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({ error: error.message });
  }
};

export const register = async (req, res) => {
  try {
    const { email, password, displayName } = req.body;

    if (!email || !password || !displayName) {
      return res.status(400).json({ 
        error: 'Email, password, and display name are required' 
      });
    }

    const result = await authService.register(email, password, displayName);
    res.status(201).json(result);
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({ error: error.message });
  }
};

export const logout = async (req, res) => {
  try {
    const result = await authService.logout();
    res.json(result);
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getSession = async (req, res) => {
  try {
    const accessToken = req.headers.authorization?.replace('Bearer ', '');
    
    if (!accessToken) {
      return res.status(401).json({ error: 'No access token provided' });
    }

    const result = await authService.getSession(accessToken);
    res.json(result);
  } catch (error) {
    console.error('Session error:', error);
    res.status(401).json({ error: error.message });
  }
};

export const getProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const profile = await authService.getProfile(userId);
    
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    
    res.json(profile);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;

    const profile = await authService.updateProfile(userId, updates);
    res.json(profile);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getUserModules = async (req, res) => {
  try {
    const { studentId } = req.params;
    // Note: studentId here refers to the student table ID, not auth user ID
    const modules = await authService.getUserModules(studentId);
    res.json(modules);
  } catch (error) {
    console.error('Get user modules error:', error);
    res.status(500).json({ error: error.message });
  }
};
