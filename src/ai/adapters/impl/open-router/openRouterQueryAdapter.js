import QueryAdapter from '../../queryAdapter.js';
import { cleanJson } from '../../../utils/json.js';
import { convertDateToTimestamp } from '../../../utils/date.js';
import { OPEN_ROUTER_CONFIGURATION } from './config.js';

/**
 * Enhanced OpenRouter Query Adapter with error handling and logging
 */
class OpenRouterQueryAdapter extends QueryAdapter {
  constructor() {
    super();
    // The adapter handles its own API key from environment variables
    this.apiKey = process.env[OPEN_ROUTER_CONFIGURATION.API_KEY_ENV_VAR] || '';
    this.baseUrl = OPEN_ROUTER_CONFIGURATION.BASE_URL;
    this.model = OPEN_ROUTER_CONFIGURATION.MODEL;
    this.requestTimeout = OPEN_ROUTER_CONFIGURATION.REQUEST_TIMEOUT;
  }

  /**
   * Log adapter operations with structured logging
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {Object} context - Additional context
   */
  log(level, message, context = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      adapter: 'OpenRouterQueryAdapter',
      model: this.model,
      ...context,
    };

    console.log(JSON.stringify(logEntry));
  }

  /**
   * Make API call with timeout and error handling
   * @param {string} url - API endpoint
   * @param {Object} options - Fetch options
   * @returns {Promise<Object>} - API response
   */
  async makeApiCall(url, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.requestTimeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        this.log('ERROR', 'API call failed', {
          status: response.status,
          statusText: response.statusText,
          errorText: errorText.substring(0, 200),
        });

        throw new Error(
          `OpenRouter API error: ${response.status} ${response.statusText}. Details: ${errorText.substring(0, 100)}`
        );
      }

      const data = await response.json();

      return data;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        this.log('ERROR', 'API call timeout', { timeout: this.requestTimeout });
        throw new Error(`Request timeout after ${this.requestTimeout}ms`);
      }

      this.log('ERROR', 'API call error', { error: error.message });
      throw error;
    }
  }

  async chatCompletions(messages, options = {}) {
    if (!Array.isArray(messages) || messages.length === 0) {
      throw new Error('Messages must be a non-empty array');
    }

    const requestBody = {
      model: options.model || this.model,
      messages,
      ...options,
    };

    return this.makeApiCall(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        ...OPEN_ROUTER_CONFIGURATION.DEFAULT_HEADERS,
      },
      body: JSON.stringify(requestBody),
    });
  }

  /**
   * Generate response with enhanced error handling
   * @param {string} prompt - Input prompt
   * @param {Object} options - Additional options
   * @returns {Promise<string|Object>} - Processed response
   */
  async generateResponse(prompt, options = {}) {
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      throw new Error('Prompt must be a non-empty string');
    }

    const messages = [{ role: 'user', content: prompt.trim() }];
    const response = await this.chatCompletions(messages, options);

    if (
      !response.choices ||
      !Array.isArray(response.choices) ||
      response.choices.length === 0
    ) {
      this.log('ERROR', 'Invalid response format - no choices', { response });
      throw new Error(
        'Invalid response format from OpenRouter API: no choices returned'
      );
    }

    if (!response.choices[0].message || !response.choices[0].message.content) {
      this.log('ERROR', 'Invalid response format - no message content', {
        choice: response.choices[0],
      });
      throw new Error(
        'Invalid response format from OpenRouter API: no message content'
      );
    }

    const raw = response.choices[0].message.content;

    console.log(raw);
    try {
      return cleanJson(raw);
    } catch (error) {
      this.log('WARN', 'Failed to parse JSON response, returning raw content', {
        error: error.message,
        rawLength: raw.length,
      });
      return raw;
    }
  }

  /**
   * Classify user query with enhanced validation
   * @param {string} query - User query to classify
   * @returns {Promise<{intent: string}>} - Query classification
   */
  async classifyQuery(query) {
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      throw new Error('Query must be a non-empty string');
    }

    const prompt = `
    Given a natural language query, classify the user query into one of :
    - "task_list": user wants tasks for specific time like today/tomorrow/next week ... (date range).
    - "date_lookup": user wants to know when a specific task/note happens.

    Return ONLY a JSON object in this format: {"intent" : "task_list | date_lookup"}.

    Only reply with valid JSON.

    Query: ${query}
    `;

    try {
      const result = await this.generateResponse(prompt);

      if (!result || typeof result.intent !== 'string') {
        this.log('ERROR', 'Invalid classification result', { result });
        throw new Error('Invalid classification result format');
      }

      const validIntents = ['task_list', 'date_lookup'];
      if (!validIntents.includes(result.intent)) {
        this.log('WARN', 'Unknown intent returned, defaulting to task_list', {
          intent: result.intent,
        });
        return { intent: 'task_list' };
      }

      return { intent: result.intent };
    } catch (error) {
      this.log('ERROR', 'Query classification failed', {
        error: error.message,
        query: query.substring(0, 50),
      });
      // Fallback to task_list for errors
      return { intent: 'task_list' };
    }
  }

  /**
   * Extract dates from query with enhanced validation
   * @param {string} query - User query containing date references
   * @returns {Promise<Object>} - MongoDB date filter object
   */
  async extractDatesFromQuery(query) {
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      this.log('WARN', 'Empty query provided for date extraction');
      return { $exists: true };
    }

    const today = new Date().toISOString().split('T')[0];

    const prompt = `
    You are a date parser. Today is ${today}
    Extract "fromDate" and "endDate" from the user's query.

    The JSON must follow this format:
    {"fromDate": "<YYYY-MM-DD>", "endDate": "<YYYY-MM-DD or null>"}

    Return ONLY a JSON object, nothing else. No text, no explanation.
    Rules:
    - Always return valid JSON.
    - "fromDate" and "endDate" must be calculated based on today when this prompt is executed — NOT based on any examples below.
    - If only "fromDate" is detected, set "endDate" to null.
    - Dates must be in ISO format (YYYY-MM-DD).
    - Correct common typos and misspellings in date words.
    - Do not include extra text, only return the JSON object.

    Examples (structure only — dates will depend on the real current date):
    User: "my task today"
    Output: {"fromDate": "<today>", "endDate": null}

    User: "give me tasks on weekend"
    Output: {"fromDate": "<Saturday>", "endDate": "<Sunday>"}

    Now parse the following query:

    "${query}"
    `;

    try {
      const result = await this.generateResponse(prompt);

      if (!result || typeof result !== 'object') {
        this.log('ERROR', 'Invalid date extraction result', { result });
        return { $exists: true };
      }

      const { fromDate, endDate } = result;

      if (!fromDate) {
        this.log('WARN', 'No fromDate found in result', { result });
        return { $exists: true };
      }

      // Validate date format
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(fromDate)) {
        this.log('ERROR', 'Invalid fromDate format', { fromDate });
        return { $exists: true };
      }

      if (endDate && !dateRegex.test(endDate)) {
        this.log('ERROR', 'Invalid endDate format', { endDate });
        return { $exists: true };
      }

      let dateFilter;
      if (fromDate && endDate) {
        dateFilter = {
          $gte: convertDateToTimestamp(fromDate),
          $lte: convertDateToTimestamp(endDate),
        };
      } else {
        dateFilter = { $eq: convertDateToTimestamp(fromDate) };
      }

      return dateFilter;
    } catch (error) {
      this.log('ERROR', 'Date extraction failed', {
        error: error.message,
        query: query.substring(0, 50),
      });
      return { $exists: true };
    }
  }

  /**
   * Update adapter model with validation
   * @param {string} model - New model name
   */
  setModel(model) {
    if (!model || typeof model !== 'string' || model.trim().length === 0) {
      throw new Error('Model must be a non-empty string');
    }

    const oldModel = this.model;
    this.model = model.trim();
    this.log('INFO', 'Model updated', { oldModel, newModel: this.model });
  }

  /**
   * Update adapter API key with validation
   * @param {string} apiKey - New API key
   */
  setApiKey(apiKey) {
    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
      throw new Error('API key must be a non-empty string');
    }

    this.apiKey = apiKey.trim();
    this.log('INFO', 'API key updated', { keyLength: this.apiKey.length });
  }

  /**
   * Update request timeout
   * @param {number} timeout - Timeout in milliseconds
   */
  setRequestTimeout(timeout) {
    if (!Number.isInteger(timeout) || timeout < 1000) {
      throw new Error('Timeout must be a positive integer (minimum 1000ms)');
    }

    const oldTimeout = this.requestTimeout;
    this.requestTimeout = timeout;
    this.log('INFO', 'Request timeout updated', {
      oldTimeout,
      newTimeout: timeout,
    });
  }

  /**
   * Get adapter configuration (excluding sensitive data)
   * @returns {Object} - Current configuration
   */
  getConfig() {
    return {
      model: this.model,
      baseUrl: this.baseUrl,
      requestTimeout: this.requestTimeout,
      hasApiKey: !!this.apiKey,
      apiKeyLength: this.apiKey ? this.apiKey.length : 0,
    };
  }

  /**
   * Health check for the adapter
   * @returns {Promise<boolean>} - Whether adapter is healthy
   */
  async healthCheck() {
    try {
      const testPrompt = 'Respond with a simple JSON object: {"status": "ok"}';
      const result = await this.generateResponse(testPrompt);
      const isHealthy = result && result.status === 'ok';

      this.log('INFO', 'Health check completed', { healthy: isHealthy });
      return isHealthy;
    } catch (error) {
      this.log('ERROR', 'Health check failed', { error: error.message });
      return false;
    }
  }
}

export default OpenRouterQueryAdapter;
