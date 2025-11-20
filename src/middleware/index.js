import supabase from '../config/supabase.js';
import { userRepository } from '../database/userRepository.js';
import cacheService from '../services/cacheService.js';

const authenticateToken = async (c, next) => {
  try {
    const authHeader = c.req.header('authorization');
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return c.json(
        {
          success: false,
          message: 'Access token required',
        },
        401
      );
    }

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return c.json(
        {
          success: false,
          message: 'Invalid or expired token',
        },
        401
      );
    }

    const iamId = user.id;

    // Try getting cached userId from IAM mapping
    const cachedUserId = cacheService.get(`iamId:${iamId}`);

    let userRecord = null;

    if (cachedUserId) {
      // Try getting cached user data
      userRecord = cacheService.get(`user:${cachedUserId}`);

      if (!userRecord) {
        // Cache had the ID but user record missing -> load from DB
        userRecord = await userRepository.getById(cachedUserId);

        if (!userRecord) {
          cacheService.del(`iamId:${iamId}`);
          return c.json(
            { success: false, message: 'Invalid or expired token' },
            401
          );
        }

        // Cache fresh user data
        cacheService.set(`user:${cachedUserId}`, userRecord);
      }
    } else {
      // Nothing cached; fetch user from DB by IAM
      userRecord = await userRepository.getByIAMId(iamId);

      if (!userRecord) {
        return c.json(
          { success: false, message: 'Invalid or expired token' },
          401
        );
      }

      // Cache mappings
      cacheService.set(`user:${userRecord.id}`, userRecord);
      cacheService.set(`iamId:${iamId}`, userRecord.id);
    }

    // Set user in context and continue
    c.set('user', userRecord);
    await next();
  } catch (error) {
    return c.json(
      {
        success: false,
        message: 'Token verification failed',
      },
      401
    );
  }
};

export { authenticateToken };
