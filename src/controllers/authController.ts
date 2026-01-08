import { publishWelcomeUserEvent } from '../events/producer/welcomeUserProducer.js';
import authService from '../services/authService.js';
import userService from '../services/userService.js';
import crypto from 'crypto';

class AuthController {
  async signInWithOtp(c) {
    try {
      const { email } = await c.req.json();

      if (!email) {
        return c.json(
          {
            success: false,
            message: 'Email is required',
          },
          400
        );
      }

      const result = await authService.signInWithOtp(email);

      if (!result.success) {
        return c.json(
          {
            success: false,
            message: result.error,
          },
          400
        );
      }

      await publishWelcomeUserEvent({
        id: crypto.randomUUID(),
        email: email,
        status: true,
      });

      return c.json({
        success: true,
        message: 'OTP sent successfully',
      });
    } catch (error) {
      console.log(error);
      return c.json(
        {
          success: false,
          message: 'Internal server error',
        },
        500
      );
    }
  }

  async verifyOtp(c) {
    try {
      const { email, token } = await c.req.json();

      if (!email || !token) {
        return c.json(
          {
            success: false,
            message: 'Email and token are required',
          },
          400
        );
      }

      const result = await authService.verifyOtp(email, token);

      if (!result.success) {
        return c.json(
          {
            success: false,
            message: result.error,
          },
          401
        );
      }

      await userService.updateIAMId(result.user.id, email);

      return c.json({
        success: true,
        user: result.user,
        session: result.session,
      });
    } catch (error) {
      console.log(error);
      return c.json(
        {
          success: false,
          message: 'Internal server error',
        },
        500
      );
    }
  }

  async logout(c) {
    try {
      const accessToken = c.req.header('authorization')?.replace('Bearer ', '');

      const result = await authService.signOut(accessToken);

      if (!result.success) {
        return c.json(
          {
            success: false,
            message: result.error,
          },
          400
        );
      }

      return c.json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      return c.json(
        {
          success: false,
          message: 'Internal server error',
        },
        500
      );
    }
  }

  async validateToken(c) {
    try {
      const accessToken = c.req.header('authorization')?.replace('Bearer ', '');

      if (!accessToken) {
        return c.json(
          {
            success: false,
            valid: false,
            message: 'No token provided',
          },
          401
        );
      }

      const result = await authService.validateToken(accessToken);

      if (!result.success) {
        return c.json(
          {
            success: false,
            valid: false,
            message: result.error,
          },
          401
        );
      }

      return c.json({
        success: true,
        valid: true,
        user: result.user,
      });
    } catch (error) {
      return c.json(
        {
          success: false,
          valid: false,
          message: 'Internal server error',
        },
        500
      );
    }
  }
}

export default new AuthController();
