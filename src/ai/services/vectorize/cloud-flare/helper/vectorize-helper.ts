import { INDEX_NAME } from '../config.js';

export const getVectorizeBaseUrl = c => {
  return `https://api.cloudflare.com/client/v4/accounts/${c.env.CLOUDFLARE_ACCOUNT_ID}/vectorize/v2/indexes/`;
};

export const getVectorizeIndexUrl = c => {
  return getVectorizeBaseUrl(c) + INDEX_NAME;
};
