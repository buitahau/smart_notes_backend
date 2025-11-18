import { inngest, INNGEST_EVENTS } from '../../config/inngest.js';
import { userRepository } from '../../database/userRepository.js';
import settingService from '../../services/settingService.js';
import userService from '../../services/userService.js';

const normalizeString = value =>
  typeof value === 'string' ? value.trim() : value;

const ensureDefaultSetting = async userId => {
  const result = await settingService.createDefaultSetting(userId);

  if (!result.success && result.error !== 'Setting already exists for this user') {
    throw new Error(result.error);
  }
};

export const processWelcomeUser = async ({ id, email }) => {
  const normalizedEmail = normalizeString(email);

  if (!id || !normalizedEmail) {
    return { success: false, error: 'User id and email are required' };
  }

  const existingUser = await userRepository.getByEmail(normalizedEmail);

  if (existingUser) {
    const updated = await userRepository.update(existingUser.id, {
      status: true,
    });
    const user = updated ?? existingUser;
    await ensureDefaultSetting(user.id);

    return { success: true, user };
  }

  const createResult = await userService.createUser(id, {
    email: normalizedEmail,
    status: true,
    firstName: '',
    lastName: '',
  });

  if (!createResult.success) {
    return createResult;
  }

  await ensureDefaultSetting(createResult.user.id);

  return createResult;
};

export const welcomeUserQueueHandler = inngest.createFunction(
  { id: 'process-welcome-user', name: 'Process Welcome User' },
  { event: INNGEST_EVENTS.WELCOME_USER },
  async ({ event }) => {
    try {
      return await processWelcomeUser(event.data ?? {});
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
);
