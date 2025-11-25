/**
 * Generate prompt for extracting dates from user query
 * @param {string} today - Today's date in YYYY-MM-DD format
 * @param {string} query - User's query
 * @returns {string} - Formatted prompt
 */
export const getDateExtractionPrompt = (today, query) => {
  return `
        You are a date parser. Today is ${today}
        Extract "specificDate", "startDate" and "endDate" from the user's query.

        The JSON must follow this format:
        {"specificDate": "<YYYY-MM-DD>", "startDate": "<YYYY-MM-DD>", "endDate": "<YYYY-MM-DD or null>"}

        Return ONLY a JSON object, nothing else. No text, no explanation.
        Rules:
        - Always return valid JSON.
        - "specificDate", "startDate" and "endDate" must be calculated based on today when this prompt is executed — NOT based on any examples below.
        - If only "specificDate" is detected, set "startDate" and "endDate" to null.
        - Dates must be in ISO format (YYYY-MM-DD).
        - Correct common typos and misspellings in date-related words.
        - Do not include extra text, only return the JSON object.

        Examples (structure only — dates will depend on ${today}):
        User: "my task today"
        Output: {"specificDate": "<today>", "startDate": null, "endDate": null}

        User: "give me tasks on weekend"
        Output: {"specificDate": null, "startDate": "<Saturday>", "endDate": "<Sunday>"}

        Now parse the following query:

        "${query}"
        `;
};
