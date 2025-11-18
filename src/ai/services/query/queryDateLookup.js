import { EMBEDDING_MODEL } from '../../constants/config.js';
import { getVectorizeIndexUrl } from '../vectorize/cloud-flare/helper/vectorize-helper.js';
import { apiClient } from '../vectorize/cloud-flare/helper/fetch.js';
import AdapterFactory from '../../adapters/adapterFactory.js';

const extractKeywordAndTimeDirection = async query => {
  const queryAdapter = AdapterFactory.getQueryAdapter();

  const prompt = `
    Extract from this query:
    1. Main keyword/activity (single word or short phrase)
    2. Time direction: "past" (did, was, last) or "future" (will, going to, next)

    Query: "${query}"

    Return JSON: {"keyword": "market", "timeDirection": "past"}

    Examples:
    - "when did I go to the market" � {"keyword": "market", "timeDirection": "past"}
    - "when will I go to the market" � {"keyword": "market", "timeDirection": "future"}
    - "when was my last appointment" � {"keyword": "appointment", "timeDirection": "past"}
    - "when is my next meeting" � {"keyword": "meeting", "timeDirection": "future"}
  `;

  try {
    const result = await queryAdapter.generateResponse(prompt);
    return result;
  } catch (error) {
    console.error('Keyword extraction failed:', error);
    // Fallback: assume past if can't determine
    return { keyword: query, timeDirection: 'past' };
  }
};

const buildDateFilter = timeDirection => {
  const now = Date.now();

  if (timeDirection === 'past') {
    return { $lt: now };
  } else {
    return { $gte: now };
  }
};

export const queryDateLookup = async c => {
  const { userId, query } = await c.req.json();
  console.log('query/date_lookup: ' + userId + '/' + query);

  if (!userId) {
    return c.json({ error: 'Missing userId' }, 400);
  }

  try {
    // Step 1: Extract keyword and time direction
    const { keyword, timeDirection } =
      await extractKeywordAndTimeDirection(query);
    console.log('Extracted:', { keyword, timeDirection });

    // Step 2: Build date filter based on time direction
    const dateFilter = buildDateFilter(timeDirection);
    console.log('Date filter:', dateFilter);

    // Step 3: Embed keyword for vector search
    const embeddingQuery = await c.env.AI.run(EMBEDDING_MODEL, {
      text: keyword,
    });

    // Step 4: Query vectorize with filter
    const data = await apiClient.post(c, `${getVectorizeIndexUrl(c)}/query`, {
      vector: embeddingQuery.data[0],
      topK: 5, // Top 5 most relevant dates
      returnMetadata: 'all',
      returnValues: true,
      filter: {
        userId,
        dateAt: dateFilter,
      },
    });

    const noteIds = (data.result?.matches || []).map(m => m.metadata.noteId);
    console.log('Found note IDs:', noteIds);

    return c.json(noteIds);
  } catch (error) {
    console.error('Date lookup error:', error);
    return c.json({ error: 'Date lookup failed' }, 500);
  }
};
