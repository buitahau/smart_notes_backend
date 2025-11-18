import AdapterFactory from '../../adapters/adapterFactory.js';

export const classifyQuery = async c => {
  const { query } = await c.req.json();
  const queryAdapter = AdapterFactory.getQueryAdapter();

  const result = await queryAdapter.classifyQuery(query);
  return c.json(result);
};
