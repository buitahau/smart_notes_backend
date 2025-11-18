// Query Adapter Interface
class QueryAdapter {
  constructor() {
    if (this.constructor === QueryAdapter) {
      throw new Error(
        'QueryAdapter is an abstract class and cannot be instantiated.'
      );
    }
  }

  /**
   * Classify a user query into intent type
   * @param {string} query - The user's natural language query
   * @returns {Promise<{intent: string}>} - The classified intent
   */
  async classifyQuery(query) {
    throw new Error('classifyQuery method must be implemented by subclass');
  }

  /**
   * Extract dates from a user query
   * @param {string} query - The user's natural language query
   * @returns {Promise<Object>} - Date filter object for MongoDB
   */
  async extractDatesFromQuery(query) {
    throw new Error(
      'extractDatesFromQuery method must be implemented by subclass'
    );
  }

  async createEmbedding(input) {
     throw new Error(
      'createEmbedding method must be implemented by subclass'
    );
  }
}

export default QueryAdapter;
