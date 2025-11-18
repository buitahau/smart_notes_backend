import settingService from '../services/settingService.js';

const MIN_INTERVAL_MINUTES = 1;
const MAX_INTERVAL_MINUTES = 24 * 60;

const ensureAuthenticatedUser = c => {
  const userId = c.get('user')?.id;
  if (!userId) {
    c.json(
      {
        success: false,
        message: 'User authentication required',
      },
      401
    );
    return null;
  }

  return userId;
};

const readJsonBody = async c => {
  try {
    const payload = await c.req.json();
    return { ok: true, payload };
  } catch {
    return {
      ok: false,
      message: 'Request body must be valid JSON',
    };
  }
};

const coerceBoolean = value => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') {
    if (value === 1) return true;
    if (value === 0) return false;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
    if (['false', '0', 'no', 'off'].includes(normalized)) return false;
  }

  return null;
};

const buildValidationError = message => ({
  ok: false,
  message,
});

const mapSetting = setting => {
  if (!setting) return null;
  return {
    id: setting.id,
    userId: setting.userId,
    receiveReminder: setting.receiveReminder,
    intervalMinutes: setting.intervalMinutes,
    createdAt: setting.createdAt,
    updatedAt: setting.updatedAt,
  };
};

const respondWithError = (c, message, status = 400) =>
  c.json(
    {
      success: false,
      message,
    },
    status
  );

class SettingController {
  async createSetting(c) {
    try {
      const userId = ensureAuthenticatedUser(c);
      if (!userId) return;

      const bodyResult = await readJsonBody(c);
      if (!bodyResult.ok) {
        return respondWithError(c, bodyResult.message, 400);
      }

      const receiveReminder = this.getReceiveReminder(bodyResult.payload.receiveReminder);
      if (!receiveReminder.ok) {
        return respondWithError(c, receiveReminder.message, 400);
      }

      const intervalMinutes = this.getIntervalMinutes(bodyResult.payload.intervalMinutes);
      if (!intervalMinutes.ok) {
        return respondWithError(c, intervalMinutes.message, 400);
      }

      const result = await settingService.createSetting(
        userId,
        receiveReminder.value,
        intervalMinutes.value
      );

      if (!result.success) {
        const status =
          result.error === 'Setting already exists for this user' ? 409 : 400;
        return respondWithError(
          c,
          result.error || 'Failed to create setting',
          status
        );
      }

      return c.json(
        {
          success: true,
          message: 'Setting created successfully',
          setting: mapSetting(result.setting),
        },
        201
      );
    } catch (error) {
      console.error('Error creating setting:', error);
      return respondWithError(
        c,
        'Internal server error while creating setting',
        500
      );
    }
  }

  async getSetting(c) {
    try {
      const userId = ensureAuthenticatedUser(c);
      if (!userId) return;

      const result = await settingService.getSettingByUserId(userId);
      if (!result.success) {
        return respondWithError(
          c,
          result.error || 'Failed to retrieve setting',
          400
        );
      }

      if (!result.setting) {
        return respondWithError(c, 'Setting not found', 404);
      }

      return c.json({
        success: true,
        setting: mapSetting(result.setting),
      });
    } catch (error) {
      console.error('Error retrieving setting:', error);
      return respondWithError(
        c,
        'Internal server error while retrieving setting',
        500
      );
    }
  }

  getReceiveReminder(inputValue) {
    if (inputValue === undefined) {
      return buildValidationError('receiveReminder must not be empty');
    }

    const coerced = coerceBoolean(inputValue);
    if (coerced === null) {
      return buildValidationError('receiveReminder must be a boolean value');
    }

    return { ok: true, value: coerced };
  }

  getIntervalMinutes(inputValue) {
    if (inputValue === undefined) {
      return buildValidationError('intervalMinutes must not be empty');
    }

    const parsed = Number(inputValue);
    if (!Number.isInteger(parsed)) {
      return buildValidationError('intervalMinutes must be an integer value');
    }

    if (parsed < MIN_INTERVAL_MINUTES || parsed > MAX_INTERVAL_MINUTES) {
      return buildValidationError(
        `intervalMinutes must be between ${MIN_INTERVAL_MINUTES} and ${MAX_INTERVAL_MINUTES} minutes`
      );
    }

    return { ok: true, value: parsed };
  }

  assignIfOk(target, key, result) {
    if (result.ok) {
      target[key] = result.value;
    } else {
      console.log(result.message);
    }
  }

  async partialUpdateSetting(c) {
    try {
      const userId = ensureAuthenticatedUser(c);
      if (!userId) return;

      const bodyResult = await readJsonBody(c);
      if (!bodyResult.ok) {
        return respondWithError(c, bodyResult.message, 400);
      }

      const updateData = {};
      this.assignIfOk(updateData, "receiveReminder", this.getReceiveReminder(bodyResult.payload.receiveReminder));
      this.assignIfOk(updateData, "intervalMinutes", this.getIntervalMinutes(bodyResult.payload.intervalMinutes));

      if (Object.keys(updateData).length === 0) {
        return respondWithError(c, "No fields to update.", 400);
      }

      const result = await settingService.partialUpdate(
        userId,
        updateData
      );

      if (!result.success) {
        const status =
          result.error === 'Setting not found' ? 404 : 400;
        return respondWithError(
          c,
          result.error || 'Failed to update setting',
          status
        );
      }

      return c.json({
        success: true,
        message: 'Setting updated successfully',
        setting: mapSetting(result.setting),
      });
    } catch (error) {
      console.error('Error updating setting:', error);
      return respondWithError(
        c,
        'Internal server error while updating setting',
        500
      );
    }
  }

}

export default new SettingController();
