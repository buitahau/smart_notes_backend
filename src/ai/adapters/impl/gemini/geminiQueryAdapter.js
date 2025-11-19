import QueryAdapter from '../../queryAdapter.js';
import { cleanJson } from '../../../utils/json.js';
import { convertDateToTimestamp } from '../../../utils/date.js';
import { GEMINI_CONFIGURATION } from './config.js';
import { VertexAI } from '@google-cloud/vertexai';
import { getDateExtractionPrompt } from '../../../prompts/dateExtractionPrompt.js';
import { getQueryClassificationPrompt } from '../../../prompts/queryClassificationPrompt.js';

/**
 * Gemini Query Adapter using Vertex AI SDK
 */
class GeminiQueryAdapter extends QueryAdapter {
    constructor() {
        super();
        this.projectId = process.env[GEMINI_CONFIGURATION.PROJECT_ID_ENV_VAR] || '';
        this.location = GEMINI_CONFIGURATION.LOCATION;
        this.model = GEMINI_CONFIGURATION.MODEL;
        this.requestTimeout = GEMINI_CONFIGURATION.REQUEST_TIMEOUT;

        // Initialize Vertex AI client
        this.vertexAI = new VertexAI({
            project: this.projectId,
            location: this.location,
        });

        // Get generative model
        this.generativeModel = this.vertexAI.getGenerativeModel({
            model: this.model,
            generationConfig: {
                responseMimeType: 'application/json',
            },
        });
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
                contents: [{
                    role: 'user',
                    parts: [{ text: prompt.trim() }]
                }],
            };

            const result = await this.generativeModel.generateContent(request);
            const response = result.response;

            if (!response.candidates || response.candidates.length === 0) {
                this.log('ERROR', 'Invalid response format - no candidates', { response });
                throw new Error('Invalid response format from Gemini API: no candidates returned');
            }

            const candidate = response.candidates[0];
            if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
                this.log('ERROR', 'Invalid response format - no content parts', { candidate });
                throw new Error('Invalid response format from Gemini API: no content parts');
            }

            const raw = candidate.content.parts[0].text;

            try {
                return cleanJson(raw);
            } catch (error) {
                this.log('WARN', 'Failed to parse JSON response, returning raw content', {
                    error: error.message,
                    rawLength: raw.length,
                });
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

            const { fromDate, endDate } = result;

            if (!fromDate) {
                this.log('WARN', 'No fromDate found in result', { result });
                return { $exists: true };
            }

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
}

export default GeminiQueryAdapter;
