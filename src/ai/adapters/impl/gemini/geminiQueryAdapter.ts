import QueryAdapter from '../../queryAdapter.js';
import { cleanJson } from '../../../utils/json.js';
import { convertDateToTimestamp } from '../../../utils/date.js';
import { GEMINI_CONFIGURATION } from './config.js';
import { GoogleGenAI } from '@google/genai';
import { getDateExtractionPrompt } from '../../../prompts/dateExtractionPrompt.js';
import { getQueryClassificationPrompt } from '../../../prompts/queryClassificationPrompt.js';

/**
 * Gemini Query Adapter using Vertex AI SDK
 */
class GeminiQueryAdapter extends QueryAdapter {
  private ai: any;
  private model: string;

  constructor() {
    super();
    this.ai = new GoogleGenAI({
      apiKey: process.env[GEMINI_CONFIGURATION.GEMINI_API_KEY_ENV_VAR],
    });
    this.model = GEMINI_CONFIGURATION.GENERATE_CONTENT_MODEL;
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
      adapter: 'GeminiQueryAdapter',
      model: this.model,
      ...context,
    };

    console.log(JSON.stringify(logEntry));
  }

  /**
   * Generate content using Vertex AI SDK
   * @param {string} prompt - Input prompt
   * @returns {Promise<string|Object>} - Processed response
   */
  async generateResponse(prompt) {
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      throw new Error('Prompt must be a non-empty string');
    }

    try {
      const request = {
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt.trim() }],
          },
        ],
      };

      const response = await this.ai.models.generateContent({
        model: GEMINI_CONFIGURATION.GENERATE_CONTENT_MODEL,
        ...request,
      });

      if (!response.candidates || response.candidates.length === 0) {
        this.log('ERROR', 'Invalid response format - no candidates', {
          response,
        });
        throw new Error(
          'Invalid response format from Gemini API: no candidates returned'
        );
      }

      const candidate = response.candidates[0];
      if (
        !candidate.content ||
        !candidate.content.parts ||
        candidate.content.parts.length === 0
      ) {
        this.log('ERROR', 'Invalid response format - no content parts', {
          candidate,
        });
        throw new Error(
          'Invalid response format from Gemini API: no content parts'
        );
      }

      const raw = candidate.content.parts[0].text;

      try {
        return cleanJson(raw);
      } catch (error) {
        this.log(
          'WARN',
          'Failed to parse JSON response, returning raw content',
          {
            error: error.message,
            rawLength: raw.length,
          }
        );
        return raw;
      }
    } catch (error) {
      this.log('ERROR', 'Generate response failed', {
        error: error.message,
        prompt: prompt.substring(0, 50),
      });
      throw error;
    }
  }

  /**
   * Classify user query
   * @param {string} query - User query to classify
   * @returns {Promise<{intent: string}>} - Query classification
   */
  async classifyQuery(query) {
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      throw new Error('Query must be a non-empty string');
    }
    const prompt = getQueryClassificationPrompt(query);

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
      return { intent: 'task_list' };
    }
  }

  /**
   * Extract dates from query
   * @param {string} query - User query containing date references
   * @returns {Promise<Object>} - MongoDB date filter object
   */
  async extractDatesFromQuery(query) {
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      this.log('WARN', 'Empty query provided for date extraction');
      return { $exists: true };
    }

    const today = new Date().toISOString().split('T')[0];

    const prompt = getDateExtractionPrompt(today, query);

    try {
      const result = await this.generateResponse(prompt);

      if (!result || typeof result !== 'object') {
        this.log('ERROR', 'Invalid date extraction result', { result });
        return { $exists: true };
      }

      const { specificDate, startDate, endDate } = result;

      let dateFilter: any = {};
      if (specificDate) {
        dateFilter.$eq = convertDateToTimestamp(specificDate);
      }
      if (startDate) {
        dateFilter.$gte = convertDateToTimestamp(startDate);
      }
      if (endDate) {
        dateFilter.$lte = convertDateToTimestamp(endDate);
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
   * Create embeddings using Vertex AI
   * @param {string} input - Text to create embeddings for
   * @returns {Promise<number[]>} - Embedding vector
   */
  async createEmbedding(input) {
    if (!input || typeof input !== 'string' || input.trim().length === 0) {
      throw new Error('Input must be a non-empty string');
    }

    try {
      const result = await this.ai.models.embedContent({
        model: GEMINI_CONFIGURATION.EMBEDDING_MODEL,
        contents: input.trim(),
      });

      if (!result.embeddings || result.embeddings.length === 0) {
        this.log('ERROR', 'Invalid embedding response - no embeddings', {
          result,
        });
        throw new Error(
          'Invalid embedding response from Gemini API: no embeddings returned'
        );
      }

      const embedding = result.embeddings[0]?.values;
      if (!Array.isArray(embedding)) {
        this.log('ERROR', 'Embedding is not an array of numbers', {
          embedding,
        });
        throw new Error('Gemini embeddings response is missing embedding data');
      }

      return embedding;
    } catch (error) {
      console.log(error);
      this.log('ERROR', 'Create embedding failed', {
        error: error.message,
        input: input.substring(0, 50),
      });
      throw error;
    }
  }
}

export default GeminiQueryAdapter;
