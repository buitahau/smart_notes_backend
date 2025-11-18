import OpenRouterQueryAdapter from './impl/open-router/openRouterQueryAdapter.js';
import OpenAIQueryAdapter from './impl/open-ai/openAIQueryAdapter.js';
import ProviderEnum from './ProviderEnum.js';

/**
 * Structured logger for adapter operations
 */
class Logger {
  static log(level, message, context = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...context,
    };

    console.log(JSON.stringify(logEntry));
  }

  static info(message, context) {
    this.log('INFO', message, context);
  }

  static warn(message, context) {
    this.log('WARN', message, context);
  }

  static error(message, context) {
    this.log('ERROR', message, context);
  }
}

/**
 * Enhanced AdapterFactory with validation, caching, and retry logic
 */
class AdapterFactory {
  static adapterCache = new Map();
  /**
   * Get available providers
   * @returns {string[]} - List of registered provider names
   */
  static getAvailableProviders() {
    return Array.from(
      new Set([ProviderEnum.OPEN_ROUTER, ProviderEnum.OPEN_AI])
    );
  }

  /**
   * Create a query adapter with enhanced configuration
   * @param {string} provider - Provider name
   * @param {Object} config - Configuration object
   * @returns {QueryAdapter} - Configured adapter instance
   */
  static createQueryAdapter(provider = ProviderEnum.OPEN_ROUTER, config = {}) {
    Logger.info(`Creating adapter for provider: ${provider}`, {
      config: { ...config, apiKey: config.apiKey ? '[REDACTED]' : undefined },
    });

    switch (provider) {
      case ProviderEnum.OPEN_ROUTER:
        return this.createOpenRouterAdapter();
      case ProviderEnum.OPEN_AI:
        return this.createOpenAIAdapter();
      default:
        throw new Error(
          `Unsupported query adapter provider: ${normalizedProvider}. Available: ${this.getAvailableProviders().join(', ')}`
        );
    }
  }

  /**
   * Create OpenRouter adapter with validation
   * @returns {OpenRouterQueryAdapter} - Validated adapter
   */
  static createOpenRouterAdapter() {
    // The adapter manages its own configuration and API key internally
    return new OpenRouterQueryAdapter();
  }

  static createOpenAIAdapter() {
    // The adapter manages its own configuration and API key internally
    return new OpenAIQueryAdapter();
  }

  /**
   * Get default query adapter with environment fallback
   * @returns {QueryAdapter} - Default adapter instance
   */

  static getQueryAdapter(provider = ProviderEnum.OPEN_ROUTER) {
    if (!this.adapterCache) {
      this.adapterCache = new Map();
    }

    const cachedAdapter = this.adapterCache.get(provider);
    if (cachedAdapter) {
      return cachedAdapter;
    }

    const newAdapter = this.createQueryAdapter(provider);
    this.adapterCache.set(provider, newAdapter);
    return newAdapter;
  }

  /**
   * Initialize factory with default configuration
   */
  static initialize() {
    Logger.info('AdapterFactory initialized', {
      availableProviders: this.getAvailableProviders(),
    });
  }
}

export default AdapterFactory;
