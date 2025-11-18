import AdapterFactory from "../adapters/adapterFactory.js";
import ProviderEnum from "../adapters/ProviderEnum.js";

export const createEmbedding = async (input) => {
  if (!input || (typeof input === 'string' && input.trim() === '')) {
    throw new Error('Invalid input for embedding creation');
  }

  try {
    const queryAdapter = AdapterFactory.getQueryAdapter(ProviderEnum.OPEN_AI);
    return queryAdapter.createEmbedding(input);
  } catch (error) {
    throw new Error(`Failed to create embedding: ${error.message}`);
  }
};