import supabase from '../config/supabase.js';

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

    c.set('user', user);
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
