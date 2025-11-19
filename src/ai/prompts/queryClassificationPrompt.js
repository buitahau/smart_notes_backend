/**
 * Generate prompt for classifying user query intent
 * @param {string} query - User's query
 * @returns {string} - Formatted prompt
 */
export const getQueryClassificationPrompt = (query) => {
    return `
    Given a natural language query, classify the user query into one of :
    - "task_list": user wants tasks for specific time like today/tomorrow/next week ... (date range).
    - "date_lookup": user wants to know when a specific task/note happens.

    Return ONLY a JSON object in this format: {"intent" : "task_list | date_lookup"}.

    Only reply with valid JSON.

    Query: ${query}
    `;
};
