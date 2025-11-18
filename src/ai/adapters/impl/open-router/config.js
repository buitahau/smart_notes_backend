/**
 * OpenRouter Provider Configuration
 * This file contains configuration for the OpenRouter AI provider
 * The API key is loaded from environment variables for security
 */

export const OPEN_ROUTER_CONFIGURATION = {
  BASE_URL: 'https://openrouter.ai/api/v1',
  MODEL: 'deepseek/deepseek-chat-v3.1:free',
  REQUEST_TIMEOUT: 30000, // 30 seconds
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'HTTP-Referer': 'https://smart-notes.example.com',
    'X-Title': 'Smart Notes AI',
  },
  RETRY_CONFIG: {
    maxRetries: 3,
    baseDelay: 1000, // 1 second
    backoffFactor: 2,
  },
  CACHE_CONFIG: {
    enabled: true,
    ttl: 300000, // 5 minutes
  },
  API_KEY_ENV_VAR: 'OPEN_ROUTER_API_KEY',
};
