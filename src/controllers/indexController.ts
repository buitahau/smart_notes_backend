import indexService from '../services/indexService.js';

class IndexController {
  async createIndex(c) {
    try {
      const result = await indexService.createIndex();

      return c.json({
        success: true,
        message: 'Vector index created successfully',
        data: result,
      });
    } catch (error) {
      console.error('IndexController.createIndex error:', error);
      return c.json(
        {
          success: false,
          message: 'Failed to create vector index',
          error: error.message,
        },
        500
      );
    }
  }

  async createMetadataIndex(c) {
    try {
      const result = await indexService.createMetadataIndex();

      return c.json({
        success: true,
        message: 'Metadata index created successfully',
        data: result,
      });
    } catch (error) {
      console.error('IndexController.createMetadataIndex error:', error);
      return c.json(
        {
          success: false,
          message: 'Failed to create metadata index',
          error: error.message,
        },
        500
      );
    }
  }

  async deleteIndex(c) {
    try {
      const { index_name } = await c.req.json();

      if (!index_name) {
        return c.json(
          {
            success: false,
            message: 'Index name is required',
          },
          400
        );
      }

      const result = await indexService.deleteIndex(index_name);

      return c.json({
        success: true,
        message: 'Index deleted successfully',
        data: result,
      });
    } catch (error) {
      console.error('IndexController.deleteIndex error:', error);
      return c.json(
        {
          success: false,
          message: 'Failed to delete index',
          error: error.message,
        },
        500
      );
    }
  }

  async listMetadataIndex(c) {
    try {
      const result = await indexService.listMetadataIndex();

      return c.json({
        success: true,
        message: 'Metadata indexes retrieved successfully',
        data: result,
      });
    } catch (error) {
      console.error('IndexController.listMetadataIndex error:', error);
      return c.json(
        {
          success: false,
          message: 'Failed to list metadata indexes',
          error: error.message,
        },
        500
      );
    }
  }
}

export default new IndexController();
