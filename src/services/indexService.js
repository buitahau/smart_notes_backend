import {
  createIndex,
  createMetadataIndex,
  deleteIndex,
  listMetadataIndex,
} from '../ai/services/vectorize/vectorize-service.js';

class IndexService {
  validateAndExtractResult(result, operation) {
    if (!result) {
      throw new Error(`Failed to ${operation}`);
    }

    if (result.error) {
      throw new Error(result.error);
    }

    return result.result;
  }

  async createIndex() {
    try {
      const result = await createIndex();
      return this.validateAndExtractResult(result, 'create index');
    } catch (error) {
      console.error('Error creating index:', error);
      throw error;
    }
  }

  async createMetadataIndex() {
    try {
      const result = await createMetadataIndex();
      return this.validateAndExtractResult(result, 'create metadata index');
    } catch (error) {
      console.error('Error creating metadata index:', error);
      throw error;
    }
  }

  async deleteIndex(indexName) {
    try {
      if (!indexName) {
        throw new Error('Index name is required');
      }

      const result = await deleteIndex(indexName);
      return this.validateAndExtractResult(result, 'delete index');
    } catch (error) {
      console.error('Error deleting index:', error);
      throw error;
    }
  }

  async listMetadataIndex() {
    try {
      const result = await listMetadataIndex();
      return this.validateAndExtractResult(result, 'retrieve metadata indexes');
    } catch (error) {
      console.error('Error listing metadata indexes:', error);
      throw error;
    }
  }
}

export default new IndexService();
