import QueryAdapter from '../../queryAdapter.js';
import { CLIPROXY_CONFIGURATION } from './config.js';
import { convertDateToTimestamp } from '../../../utils/date.js';
import { getDateExtractionPrompt } from '../../../prompts/dateExtractionPrompt.js';
import { getQueryClassificationPrompt } from '../../../prompts/queryClassificationPrompt.js';
import { cleanJson } from '../../../utils/json.js';

class CliProxyQueryAdapter extends QueryAdapter {
    constructor() {
        super();
        this.baseUrl = CLIPROXY_CONFIGURATION.BASE_URL;
        this.textModel = CLIPROXY_CONFIGURATION.TEXT_MODEL;
        this.apiKey = process.env[CLIPROXY_CONFIGURATION.API_KEY_ENV_VAR];
    }

    async makeModelResponse(model, input) {
        // Input is treated as user message content
        const messages = [
            {
                role: 'user',
                content: input,
            },
        ];

        const response = await fetch(`${this.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({
                model: model,
                messages: messages,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data?.error?.message ||
                `CliProxy request failed: ${response.status} ${response.statusText}`
            );
        }

        // Standard OpenAI format: choices[0].message.content
        const content = data?.choices?.[0]?.message?.content;

        if (!content) {
            console.error('Invalid response format from CliProxy model:', data);
            throw new Error('Invalid response format from model');
        }

        return content;
    }

    async extractDatesFromQuery(query) {
        if (!query || typeof query !== 'string' || query.trim().length === 0) {
            console.warn('Empty query provided for date extraction');
            return { $exists: true };
        }

        const today = new Date().toISOString().split('T')[0];
        const prompt = getDateExtractionPrompt(today, query);

        try {
            const resultRaw = await this.makeModelResponse(this.textModel, prompt);

            // Clean and parse JSON
            let result;
            try {
                result = cleanJson(resultRaw);
            } catch (e) {
                // If cleanJson fails, try parsing directly to see if it works
                result = JSON.parse(resultRaw);
            }

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
            // Fallback to existence check if extraction fails
            return { $exists: true };
        }
    }

    async classifyQuery(query) {
        if (!query || typeof query !== 'string' || query.trim().length === 0) {
            throw new Error('Query must be a non-empty string');
        }
        const prompt = getQueryClassificationPrompt(query);

        try {
            const resultRaw = await this.makeModelResponse(this.textModel, prompt);

            let result;
            try {
                result = cleanJson(resultRaw);
            } catch (e) {
                result = JSON.parse(resultRaw);
            }

            if (!result || typeof result.intent !== 'string') {
                throw new Error('Invalid classification result format');
            }

            const validIntents = ['task_list', 'date_lookup'];
            if (!validIntents.includes(result.intent)) {
                // Default to task_list if unknown
                return { intent: 'task_list' };
            }

            return { intent: result.intent };
        } catch (error) {
            console.error('Query classification failed', error);
            return { intent: 'task_list' };
        }
    }
}

export default CliProxyQueryAdapter;
