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
   */
  async classifyQuery(query: string): Promise<{ intent: string }> {
    throw new Error('classifyQuery method must be implemented by subclass');
  }

  /**
   * Extract dates from a user query
   */
  async extractDatesFromQuery(query: string): Promise<any> {
    throw new Error(
      'extractDatesFromQuery method must be implemented by subclass'
    );
  }

  async createEmbedding(input: string): Promise<number[]> {
    throw new Error('createEmbedding method must be implemented by subclass');
  }
}

export default QueryAdapter;
