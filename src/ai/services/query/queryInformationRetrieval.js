import { getVectorizeIndexUrl } from '../vectorize/cloud-flare/helper/vectorize-helper.js';
import { apiClient } from '../vectorize/cloud-flare/helper/fetch.js';

const EMBEDDING_MODEL = '@cf/baai/bge-base-en-v1.5';

export const queryInformationRetrieval = async c => {
    const { userId, query } = await c.req.json();
    console.log('query/information_retrieval: ' + userId + '/' + query);

    if (!userId) {
        return c.json({ error: 'Missing userId' }, 400);
    }

    try {
        // Step 1: Embed query for vector search
        const embeddingQuery = await c.env.AI.run(EMBEDDING_MODEL, {
            text: query,
        });

        // Step 2: Query vectorize
        const data = await apiClient.post(c, `${getVectorizeIndexUrl(c)}/query`, {
            vector: embeddingQuery.data[0],
            topK: 10, // Retrieve top 10 most relevant notes
            returnMetadata: 'all',
            returnValues: true,
            filter: {
                userId,
            },
        });

        const noteIds = (data.result?.matches || []).map(m => m.metadata.noteId);
        console.log('Found note IDs:', noteIds);

        return c.json(noteIds);
    } catch (error) {
        console.error('Information retrieval error:', error);
        return c.json({ error: 'Information retrieval failed' }, 500);
    }
};
