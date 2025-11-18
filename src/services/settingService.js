import crypto from 'crypto';
import { settingRepository } from '../database/settingRepository.js';

const DEFAULT_SETTING = {
  receiveReminder: true,
  intervalMinutes: 60,
};

class SettingService {
  async createSetting(userId, receiveReminder, intervalMinutes) {
    try {
      const existing = await settingRepository.existingByUserId(userId);
      console.log(existing);
      if (existing) {
        return {
          success: false,
          error: 'Setting already exists for this user',
        };
      }

      const setting = await settingRepository.create({
        id: crypto.randomUUID(),
        userId,
        receiveReminder,
        intervalMinutes
      });

      return { success: true, setting };
    } catch (error) {
      console.log(error)
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async getSettingByUserId(userId) {
    try {
      const setting = await settingRepository.getByUserId(userId);
      return {
        success: true,
        setting,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async updateSetting(userId, receiveReminder, intervalMinutes) {
    try {
      const existing = await settingRepository.getByUserId(userId);
      if (!existing) {
        return {
          success: false,
          error: 'Setting not found',
        };
      }

      const updated = await settingRepository.update(existing.id, {
        receiveReminder,
        intervalMinutes,
      });

      return {
        success: true,
        setting: updated,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async partialUpdate(userId, updates) {
    try {
      const existing = await settingRepository.getByUserId(userId);
      if (!existing) {
        return {
          success: false,
          error: 'Setting not found',
        };
      }

      const updatePayload = {};
      if (typeof updates.receiveReminder === 'boolean') {
        updatePayload.receiveReminder = updates.receiveReminder;
      }
      if (typeof updates.intervalMinutes === 'number') {
        updatePayload.intervalMinutes = updates.intervalMinutes;
      }

      if (Object.keys(updatePayload).length === 0) {
        return {
          success: true,
          setting: existing,
        };
      }

      const updated = await settingRepository.update(
        existing.id,
        updatePayload
      );

      return {
        success: true,
        setting: updated,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async deleteSetting(userId) {
    try {
      const existing = await settingRepository.getByUserId(userId);
      if (!existing) {
        return {
          success: false,
          error: 'Setting not found',
        };
      }

      await settingRepository.delete(existing.id);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async createDefaultSetting(userId) {
    return this.createSetting(
      userId,
      DEFAULT_SETTING.receiveReminder,
      DEFAULT_SETTING.intervalMinutes
    );
  }
}

export default new SettingService();
