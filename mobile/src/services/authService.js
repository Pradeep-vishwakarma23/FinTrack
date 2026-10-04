import api from './api.js';
import secureStore from './secureStore.js';

export const authService = {
  /**
   * Log in user with email and password
   */
  async login(email, password) {
    const payload = {
      email: email.trim().toLowerCase(),
      password
    };
    
    const response = await api.post('/auth/login', payload);
    
    if (response?.token) {
      await secureStore.saveToken(response.token);
      if (response.user) {
        await secureStore.saveUser(response.user);
      }
    }
    
    return response;
  },

  /**
   * Register a new user
   */
  async signup(name, email, password) {
    const payload = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password
    };

    const response = await api.post('/auth/signup', payload);

    if (response?.token) {
      await secureStore.saveToken(response.token);
      if (response.user) {
        await secureStore.saveUser(response.user);
      }
    }

    return response;
  },

  /**
   * Get authenticated user profile from backend
   */
  async getMe() {
    const response = await api.get('/auth/me');
    if (response?.user) {
      await secureStore.saveUser(response.user);
    }
    return response;
  },

  /**
   * Restore existing session from SecureStore on startup
   */
  async restoreSession() {
    try {
      const token = await secureStore.getToken();
      if (!token) return null;

      const cachedUser = await secureStore.getUser();

      // Verify token freshness with backend /auth/me
      try {
        const remoteProfile = await this.getMe();
        return {
          token,
          user: remoteProfile?.user || cachedUser
        };
      } catch (err) {
        // If offline, use cached user if available
        if (err?.isNetworkError && cachedUser) {
          return { token, user: cachedUser, isOffline: true };
        }
        // If token is invalid / 401, clear storage
        await secureStore.clearAuth();
        return null;
      }
    } catch {
      return null;
    }
  },

  /**
   * Log out user
   */
  async logout() {
    await secureStore.clearAuth();
    return { success: true };
  }
};

export default authService;
