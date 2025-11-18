import queryService from '../services/queryService.js';

class QueryController {
  async query(c) {
    try {
      const { query } = await c.req.json();
      // Extract userId from authenticated user (set by authenticateToken middleware)
      console.log(query);
      const userId = c.get('user')?.id;

      // Enhanced validation
      if (!userId) {
        return c.json(
          {
            success: false,
            message: 'User authentication required',
          },
          401
        );
      }
      const response = await queryService.query(userId, query);
      return c.json({
        success: true,
        notes: response,
      });
    } catch (error) {
      console.error('Error querying note:', error);
      return c.json(
        {
          success: false,
          message: 'Internal server error while querying note',
        },
        500
      );
    }
  }
}

export default new QueryController();
