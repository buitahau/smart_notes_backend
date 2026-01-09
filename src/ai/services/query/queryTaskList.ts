import AdapterFactory from '../../adapters/adapterFactory.js';
import ProviderEnum from '../../adapters/ProviderEnum.js';
import { createEmbedding } from '../embedding-service.js';
import CloudFlareVectorizeService from '../vectorize/cloud-flare/cloud-flare-vectorize-service.js';

const extractDatesFromQuery = async (query) => {
  const queryAdapter = AdapterFactory.getQueryAdapter(ProviderEnum.GEMINI);
  return await queryAdapter.extractDatesFromQuery(query);
};

export const queryTaskList = async (userId, query) => {
  if (!userId) {
    return { error: 'Missing userId' };
  }

  let filter = { userId };

  // Extract dates from query
  const dateFilter = await extractDatesFromQuery(query);
  if (dateFilter) {
    filter.dateAt = dateFilter;
  } else {
    console.error('Can not extract the dates from query ' + query);
  }

  const embeddingVector = await createEmbedding(query);

  const vectorizeService = new CloudFlareVectorizeService();
  const matches = await vectorizeService.queryVectors(embeddingVector, filter, 10);

  const noteIds = matches.map(m => m.metadata.noteId);
  return noteIds;
};
