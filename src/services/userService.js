import { userRepository } from '../database/userRepository.js';
import cacheService from './cacheService.js';

const normalizeString = value =>
  typeof value === 'string' ? value.trim() : value;

class UserService {
  async getUserDetail(userId) {
    try {
      let user = await userRepository.getById(userId);

      if (user) {
        return { success: true, user };
      }

      user = await userRepository.getByIAMId(userId);

      if (user) {
        return { success: true, user };
      }

      return { success: false, error: "Not found user" };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }


  async updateUser(userId, updates = {}) {
    try {
      const existing = await userRepository.getById(userId);

      if (!existing) {
        return {
          success: false,
          error: 'User not found',
        };
      }

      if (
        updates.email !== undefined &&
        normalizeString(updates.email) !== existing.email
      ) {
        return {
          success: false,
          error: 'Email cannot be modified',
        };
      }

      const updatePayload = {};

      if (updates.firstName !== undefined) {
        const normalizedFirst = normalizeString(updates.firstName) ?? '';
        if (normalizedFirst !== existing.firstName) {
          updatePayload.firstName = normalizedFirst;
        }
      }

      if (updates.lastName !== undefined) {
        const normalizedLast = normalizeString(updates.lastName) ?? '';
        if (normalizedLast !== existing.lastName) {
          updatePayload.lastName = normalizedLast;
        }
      }

      if (Object.keys(updatePayload).length === 0) {
        return {
          success: true,
          user: existing,
        };
      }

      const updated = await userRepository.update(userId, updatePayload);

      // Invalidate cache after update
      cacheService.del(`user:${userId}`);

      return {
        success: true,
        user: updated ?? existing,
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async createUser(userId, payload = {}) {
    try {
      if (!userId) {
        return { success: false, error: 'User ID is required' };
      }

      const existing = await userRepository.getById(userId);
      if (existing) {
        return { success: false, error: 'User already exists' };
      }

      const email =
        typeof payload.email === 'string' ? payload.email.trim() : null;
      if (!email) {
        return { success: false, error: 'Email is required' };
      }

      const user = await userRepository.create({
        id: userId,
        email,
        firstName: normalizeString(payload.firstName) ?? '',
        lastName: normalizeString(payload.lastName) ?? '',
        status:
          typeof payload.status === 'boolean' ? payload.status : false,
        iamId: null,
      });

      return { success: true, user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async updateIAMId(iamId, email) {
    try {
      const normalizedEmail = normalizeString(email);

      if (!iamId || !normalizedEmail) {
        return { success: false, error: 'IAM id and email are required' };
      }

      const existingUser = await userRepository.getByEmail(normalizedEmail);
      if (!existingUser) {
        return { success: false, error: 'Not found user with email ' + email };
      }

      if (existingUser.iamId) {
        return { success: true, existingUser };
      }

      const updated = await userRepository.update(existingUser.id, { iamId });

      // Invalidate cache after IAM ID update
      cacheService.del(`user:${existingUser.id}`);

      return { success: true, updated };
    } catch (error) {
      console.log(error);
      return { success: false, error: error.message };
    }
  }

  async deleteUser(userId) {
    try {
      const existing = await userRepository.getById(userId);
      if (!existing) {
        return { success: false, error: 'User not found' };
      }

      const deleted = await userRepository.delete(userId);

      // Invalidate cache after deletion
      cacheService.del(`user:${userId}`);

      return { success: true, user: deleted ?? existing };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

}

const userService = new UserService();

export default userService;
