import supabase from '../config/supabase.js';

class AuthService {

  async signInWithOtp(email) {
    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
      });

      if (error) {
        throw error;
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async verifyOtp(email, token) {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email',
      });

      if (error) {
        throw error;
      }

      return {
        success: true,
        user: data.user,
        session: data.session,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }


  async signOut(accessToken) {
    try {
      const { error } = await supabase.auth.signOut(accessToken);

      if (error) {
        throw error;
      }

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async validateToken(accessToken) {
    try {
      const { data, error } = await supabase.auth.getUser(accessToken);

      if (error) {
        throw error;
      }

      return {
        success: true,
        user: data.user,
        valid: true,
      };
    } catch (error) {
      return {
        success: false,
        valid: false,
        error: error.message,
      };
    }
  }
}

export default new AuthService();
