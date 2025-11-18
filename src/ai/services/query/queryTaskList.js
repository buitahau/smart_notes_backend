import { getVectorizeIndexUrl } from '../vectorize/cloud-flare/helper/vectorize-helper.js';
import { apiClient } from '../vectorize/cloud-flare/helper/fetch.js';
import AdapterFactory from '../../adapters/adapterFactory.js';
import ProviderEnum from '../../adapters/ProviderEnum.js';
import { createEmbedding } from '../embedding-service.js';

const extractDatesFromQuery = async (c, query) => {
  const queryAdapter = AdapterFactory.getQueryAdapter(ProviderEnum.OPEN_AI);
  return await queryAdapter.extractDatesFromQuery(query);
};

export const queryTaskList = async c => {
  const { userId, query } = await c.req.json();
  if (!userId) {
    return c.json({ error: 'Missing userId' }, 400);
  }

  const filter = { userId };

  // Extract dates from query
  const dateFilter = await extractDatesFromQuery(c, query);
  if (dateFilter || dateFilter != {}) {
    console.log('Extracted date filter:', dateFilter);
    filter.dateAt = dateFilter;
  } else {
    console.error('Can not extract the dates from query ' + query);
  }

  const embeddingVector = await createEmbedding(query);

  const data = await apiClient.post(c, `${getVectorizeIndexUrl(c)}/query`, {
    vector: embeddingVector,
    topK: 10,
    returnMetadata: 'all',
    returnValues: false,
    filter,
  });

  const noteIds = (data.result?.matches || []).map(m => m.metadata.noteId);
  return noteIds;
};
