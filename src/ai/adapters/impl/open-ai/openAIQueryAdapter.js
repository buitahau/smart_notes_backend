import QueryAdapter from '../../queryAdapter.js';
import { OPEN_AI_CONFIGURATION } from './config.js';
import { convertDateToTimestamp } from '../../../utils/date.js';

class OpenAIQueryAdapter extends QueryAdapter {
  constructor() {
    super();
    this.baseUrl = OPEN_AI_CONFIGURATION.BASE_URL;
    this.textModel = OPEN_AI_CONFIGURATION.TEXT_MODEL;
    this.embeddingModel = OPEN_AI_CONFIGURATION.EMBEDDING_MODEL;
    this.apiKey = process.env[OPEN_AI_CONFIGURATION.OPENAI_API_KEY_ENV_VAR];
  }

  async extractDatesFromQuery(query) {
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      console.warn('Empty query provided for date extraction');
      return { $exists: true };
    }

    const today = new Date().toISOString().split('T')[0];

    const prompt = `
        You are a date parser. Today is ${today}
        Extract "specificDate", "startDate" and "endDate" from the user's query.

        The JSON must follow this format:
        {"specificDate": "<YYYY-MM-DD>", "startDate": "<YYYY-MM-DD>", "endDate": "<YYYY-MM-DD or null>"}

        Return ONLY a JSON object, nothing else. No text, no explanation.
        Rules:
        - Always return valid JSON.
        - "specificDate", "startDate" and "endDate" must be calculated based on today when this prompt is executed — NOT based on any examples below.
        - If only "specificDate" is detected, set "startDate" and "endDate" to null.
        - Dates must be in ISO format (YYYY-MM-DD).
        - Correct common typos and misspellings in date-related words.
        - Do not include extra text, only return the JSON object.

        Examples (structure only — dates will depend on ${today}):
        User: "my task today"
        Output: {"specificDate": "<today>", "startDate": null, "endDate": null}

        User: "give me tasks on weekend"
        Output: {"specificDate": null, "startDate": "<Saturday>", "endDate": "<Sunday>"}

        Now parse the following query:

        "${query}"
        `;

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
