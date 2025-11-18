import supabase from '../config/supabase.js';
import { publishWelcomeUserEvent } from '../events/producer/welcomeUserProducer.js';

class WelcomeController {
  async getWelcome(c) {
    try {
      const user = await this.verifyToken(c);

      if (!user) {
        return c.json(
          {
            success: false,
            message: 'Invalid or missing token',
          },
          401
        );
      }

      if (!user.email) {
        return c.json(
          {
            success: false,
            message: 'Authenticated user does not have an email address',
          },
          400
        );
      }

      await publishWelcomeUserEvent({
        id: user.id,
        email: user.email,
        status: true,
      });

      return c.json(
        {
          success: true,
          message: 'Welcome to Smart Notes API',
        },
        200
      );
    } catch (error) {
      console.error('WelcomeController.getWelcome error:', error);

      return c.json(
        {
          success: false,
          message: 'Failed to process welcome request',
        },
        500
      );
    }
  }

  async verifyToken(c) {
    const authHeader = c.req.header('authorization');
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return null;
    }

    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token);

      if (error || !user) {
        return null;
      }

      return user;
    } catch (error) {
      console.error('WelcomeController.verifyToken error:', error);
      return null;
    }
  }
}

export default new WelcomeController();
