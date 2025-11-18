import { userRepository } from '../database/userRepository.js';

const normalizeString = value =>
  typeof value === 'string' ? value.trim() : value;

class UserService {
  async getUserDetail(userId, fallbackData = {}) {
    try {
      let user = await userRepository.getById(userId);

      if (user) {
        return { success: true, user };
      }

      if (!fallbackData.email) {
        return {
          success: false,
          error: 'User not found',
        };
      }

      user = await userRepository.create({
        id: userId,
        email: fallbackData.email,
        firstName: normalizeString(fallbackData.firstName) ?? '',
        lastName: normalizeString(fallbackData.lastName) ?? '',
      });

      return { success: true, user };
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
      });

      return { success: true, user };
    } catch (error) {
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
      return { success: true, user: deleted ?? existing };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

}

const userService = new UserService();

export default userService;
