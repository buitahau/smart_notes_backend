import {
  createPostConfig,
  createDeleteConfig,
  createGetConfig,
  createPutConfig,
  createPostNdjsonConfig,
} from './fetchConfig.js';

export class FetchError extends Error {
  constructor(message, status, response) {
    super(message);
    this.name = 'FetchError';
    this.status = status;
    this.response = response;
  }
}

export const handleFetchResponse = async response => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new FetchError(
      errorData.message || `HTTP error! status: ${response.status}`,
      response.status,
      errorData
    );
  }

  try {
    return await response.json();
  } catch (error) {
    throw new FetchError(
      'Failed to parse JSON response',
      response.status,
      null
    );
  }
};

export const apiClient = {
  post: async (c, url, body, options = {}) => {
    const config = createPostConfig(c, body, options);
    const response = await fetch(url, config);
    return handleFetchResponse(response);
  },

  postNdjson: async (c, url, body, options = {}) => {
    const config = createPostNdjsonConfig(c, body, options);
    const response = await fetch(url, config);
    return handleFetchResponse(response);
  },

  get: async (c, url, options = {}) => {
    const config = createGetConfig(c, options);
    const response = await fetch(url, config);
    return handleFetchResponse(response);
  },

  put: async (c, url, body, options = {}) => {
    const config = createPutConfig(c, body, options);
    const response = await fetch(url, config);
    return handleFetchResponse(response);
  },

  delete: async (c, url, options = {}) => {
    const config = createDeleteConfig(c, options);
    const response = await fetch(url, config);
    return handleFetchResponse(response);
  },

  raw: async (c, url, config) => {
    const response = await fetch(url, config);
    return handleFetchResponse(response);
  },
};
