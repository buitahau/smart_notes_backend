/**
 * Generate prompt for classifying user query intent
 * @param {string} query - User's query
 * @returns {string} - Formatted prompt
 */
export const getQueryClassificationPrompt = query => {
  return `
    Given a natural language query, classify the user query into one of :
    - "task_list": user wants to find tasks (e.g., "my task tomorrow", "tasks for next week").
    - "date_lookup": user wants to know when a specific task/note happens (e.g., "which date i complete task xx").
    - "information_retrieval": user wants to find general information or answer a question based on notes (e.g., "sql to get all information's user").

    Return ONLY a JSON object in this format: {"intent" : "task_list | date_lookup | information_retrieval"}.

    Only reply with valid JSON.

    Query: ${query}
    `;
};
