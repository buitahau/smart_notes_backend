import userService from '../services/userService.js';

const ensureAuthenticatedUser = c => {
  const authUser = c.get('user');
  if (!authUser?.id) {
    c.json(
      {
        success: false,
        message: 'User authentication required',
      },
      401
    );
    return null;
  }

  return authUser;
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

const mapUser = user => {
  if (!user) return null;
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    status: user.status,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

const parseNameField = (value, fieldName) => {
  if (value === undefined) {
    return {
      ok: false,
      message: `${fieldName} is required`,
    };
  }

  if (typeof value !== 'string') {
    return {
      ok: false,
      message: `${fieldName} must be a string`,
    };
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return {
      ok: false,
      message: `${fieldName} must not be empty`,
    };
  }

  return { ok: true, value: trimmed };
};

class UserController {
  async createUser(c) {
    const bodyResult = await readJsonBody(c);
    if (!bodyResult.ok) {
      return c.json(
        {
          success: false,
          message: bodyResult.message,
        },
        400
      );
    }

    const payload = bodyResult.payload;
    if (!payload || typeof payload !== 'object') {
      return c.json(
        {
          success: false,
          message: 'Request body must be an object',
        },
        400
      );
    }

    if (typeof payload.id !== 'string' || !payload.id.trim()) {
      return c.json(
        {
          success: false,
          message: 'id is required',
        },
        400
      );
    }

    if (typeof payload.email !== 'string' || !payload.email.trim()) {
      return c.json(
        {
          success: false,
          message: 'email is required',
        },
        400
      );
    }

    const userPayload = {
      email: payload.email.trim(),
    };

    if (payload.firstName !== undefined) {
      const firstNameResult = parseNameField(payload.firstName, 'firstName');
      if (!firstNameResult.ok) {
        return c.json(
          {
            success: false,
            message: firstNameResult.message,
          },
          400
        );
      }
      userPayload.firstName = firstNameResult.value;
    }

    if (payload.lastName !== undefined) {
      const lastNameResult = parseNameField(payload.lastName, 'lastName');
      if (!lastNameResult.ok) {
        return c.json(
          {
            success: false,
            message: lastNameResult.message,
          },
          400
        );
      }
      userPayload.lastName = lastNameResult.value;
    }

    const result = await userService.createUser(payload.id.trim(), userPayload);

    if (!result.success) {
      const statusCode =
        result.error === 'User already exists' ? 409 : 400;

      return c.json(
        {
          success: false,
          message: result.error || 'Failed to create user',
        },
        statusCode
      );
    }

    return c.json(
      {
        success: true,
        user: mapUser(result.user),
      },
      201
    );
  }

  async getUserDetail(c) {
    const authUser = ensureAuthenticatedUser(c);
    if (!authUser) return c;

    if (!authUser.email) {
      return c.json(
        {
          success: false,
          message: 'Authenticated user does not include an email address',
        },
        400
      );
    }

    const metadata = authUser.user_metadata || {};
    const fallbackNames = {
      firstName: metadata.firstName || metadata.first_name || '',
      lastName: metadata.lastName || metadata.last_name || '',
    };

    const result = await userService.getUserDetail(authUser.id, {
      email: authUser.email,
      ...fallbackNames,
    });

    if (!result.success) {
      return c.json(
        {
          success: false,
          message: result.error || 'Failed to load user profile',
        },
        result.error === 'User not found' ? 404 : 400
      );
    }

    return c.json({
      success: true,
      user: mapUser(result.user),
    });
  }

  async updateUser(c) {
    const authUser = ensureAuthenticatedUser(c);
    if (!authUser) return c;

    if (!authUser.email) {
      return c.json(
        {
          success: false,
          message: 'Authenticated user does not include an email address',
        },
        400
      );
    }

    const bodyResult = await readJsonBody(c);
    if (!bodyResult.ok) {
      return c.json(
        {
          success: false,
          message: bodyResult.message,
        },
        400
      );
    }

    const payload = bodyResult.payload;
    if (!payload || typeof payload !== 'object') {
      return c.json(
        {
          success: false,
          message: 'Request body must be an object',
        },
        400
      );
    }

    const updateFields = {};
    let hasUpdatableField = false;

    if (payload.firstName !== undefined) {
      const firstNameResult = parseNameField(payload.firstName, 'firstName');
      if (!firstNameResult.ok) {
        return c.json(
          {
            success: false,
            message: firstNameResult.message,
          },
          400
        );
      }
      updateFields.firstName = firstNameResult.value;
      hasUpdatableField = true;
    }

    if (payload.lastName !== undefined) {
      const lastNameResult = parseNameField(payload.lastName, 'lastName');
      if (!lastNameResult.ok) {
        return c.json(
          {
            success: false,
            message: lastNameResult.message,
          },
          400
        );
      }
      updateFields.lastName = lastNameResult.value;
      hasUpdatableField = true;
    }

    if (!hasUpdatableField) {
      return c.json(
        {
          success: false,
          message: 'At least one of firstName or lastName must be provided',
        },
        400
      );
    }

    if (
      payload.email !== undefined &&
      payload.email !== authUser.email
    ) {
      return c.json(
        {
          success: false,
          message: 'Email cannot be updated',
        },
        400
      );
    }

    // Ensure the user record exists before attempting to update.
    const metadata = authUser.user_metadata || {};
    const ensureResult = await userService.getUserDetail(authUser.id, {
      email: authUser.email,
      firstName: metadata.firstName || metadata.first_name || '',
      lastName: metadata.lastName || metadata.last_name || '',
    });

    if (!ensureResult.success) {
      return c.json(
        {
          success: false,
          message: ensureResult.error || 'Unable to prepare user profile for update',
        },
        400
      );
    }

    const result = await userService.updateUser(authUser.id, updateFields);

    if (!result.success) {
      const status = result.error === 'Email cannot be modified' ? 400 : 404;
      return c.json(
        {
          success: false,
          message: result.error || 'Failed to update user',
        },
        status
      );
    }

    return c.json({
      success: true,
      user: mapUser(result.user),
    });
  }
}

export default new UserController();
