import QueryAdapter from '../../queryAdapter.js';
import { OPEN_AI_CONFIGURATION } from './config.js';
import { convertDateToTimestamp } from '../../../utils/date.js';
import { getDateExtractionPrompt } from '../../../prompts/dateExtractionPrompt.js';

class OpenAIQueryAdapter extends QueryAdapter {
  constructor() {
    super();
    this.baseUrl = OPEN_AI_CONFIGURATION.BASE_URL;
    this.textModel = OPEN_AI_CONFIGURATION.TEXT_MODEL;
    this.embeddingModel = OPEN_AI_CONFIGURATION.EMBEDDING_MODEL;
    this.embeddingDimensions = OPEN_AI_CONFIGURATION.EMBEDDING_DIMENSIONS;
    this.apiKey = process.env[OPEN_AI_CONFIGURATION.OPENAI_API_KEY_ENV_VAR];
  }

  async extractDatesFromQuery(query) {
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      console.warn('Empty query provided for date extraction');
      return { $exists: true };
    }

    const today = new Date().toISOString().split('T')[0];
    const prompt = getDateExtractionPrompt(today, query);

    try {
      const result = await this.makeModelResponse(this.textModel, prompt);
      const { specificDate, startDate, endDate } = result;

      let dateFilter = {};
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
      console.error('Date extraction failed with query ' + query, error);
      return null;
    }
  }

  async createEmbedding(input) {
    const response = await fetch(`${this.baseUrl}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        input,
        model: this.embeddingModel,
        dimensions: this.embeddingDimensions,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data?.error?.message ||
        `OpenAI embeddings request failed: ${response.status}`
      );
    }

    const embedding = data?.data?.[0]?.embedding;

    if (!Array.isArray(embedding)) {
      throw new Error('OpenAI embeddings response is missing embedding data');
    }

    return embedding;
  }

  async makeModelResponse(model, input) {
    const response = await fetch(`${this.baseUrl}/responses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        input,
        model,
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(
        data?.error?.message || `OpenAI request failed: ${response.status}`
      );
    }

    const content = data?.output?.[1]?.content;
    const text = content?.[0].text;
    console.log(text);
    if (!text) {
      console.error('Invalid response format from model:', data);
      throw new Error('Invalid response format from model');
    }

    try {
      return JSON.parse(text);
    } catch (error) {
      console.error('Failed to parse JSON from model response:', text);
      throw new Error('Invalid JSON response from model');
    }
  }
}

export default OpenAIQueryAdapter;
