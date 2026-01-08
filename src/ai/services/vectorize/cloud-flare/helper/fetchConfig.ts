export const API_METHODS = {
  POST: 'POST',
  DELETE: 'DELETE',
  GET: 'GET',
  PUT: 'PUT',
};

export const CONTENT_TYPES = {
  JSON: 'application/json',
  NDFLSON: 'application/x-ndjson',
};

const createBaseConfig = (c, customConfig = {}) => {
  const baseConfig = {
    headers: {
      Authorization: `Bearer ${c.env.CLOUDFLARE_API_TOKEN}`,
    },
  };

  const { headers, ...restCustomConfig } = customConfig;

  if (headers) {
    baseConfig.headers = { ...baseConfig.headers, ...headers };
  }

  return {
    ...baseConfig,
    ...restCustomConfig,
  };
};

export const createPostConfig = (c, body, customConfig = {}) => {
  return createBaseConfig(c, {
    method: API_METHODS.POST,
    headers: {
      'Content-Type': CONTENT_TYPES.JSON,
    },
    body: JSON.stringify(body),
    ...customConfig,
  });
};

export const createDeleteConfig = (c, customConfig = {}) => {
  return createBaseConfig(c, {
    method: API_METHODS.DELETE,
    headers: {
      'Content-Type': CONTENT_TYPES.JSON,
    },
    ...customConfig,
  });
};

export const createGetConfig = (c, customConfig = {}) => {
  return createBaseConfig(c, {
    method: API_METHODS.GET,
    ...customConfig,
  });
};

export const createPutConfig = (c, body, customConfig = {}) => {
  return createBaseConfig(c, {
    method: API_METHODS.PUT,
    headers: {
      'Content-Type': CONTENT_TYPES.JSON,
    },
    body: JSON.stringify(body),
    ...customConfig,
  });
};

export const createPostNdjsonConfig = (c, body, customConfig = {}) => {
  return createBaseConfig(c, {
    method: API_METHODS.POST,
    headers: {
      'Content-Type': CONTENT_TYPES.NDFLSON,
    },
    body: JSON.stringify(body),
    ...customConfig,
  });
};
