/**
 * Generate prompt for classifying user query intent
 * @param {string} query - User's query
 * @returns {string} - Formatted prompt
 */
export const getQueryClassificationPrompt = query => {
  return `
You are an intent classifier for a personal productivity system.

Your job is to determine what the user wants to do with their notes or tasks.

---

## Available intents

### 1. \`task_list\`

The user wants to **view a list of tasks** filtered by time or status.

Includes:

* Today / tomorrow / this week / next week
* Overdue / upcoming
* Schedule planning
* Agenda queries

Examples:

* "what are my tasks today"
* "show tasks tomorrow"
* "do I have anything next week"
* "my schedule this weekend"
* "things I need to do tonight"

Key signal:
👉 The user wants multiple tasks, not a specific one.

---

### 2. \`date_lookup\`

The user wants to **know the date/time of a specific task or note**.

Includes:

* When something happens
* Deadline lookup
* Completion date lookup
* Due date questions

Examples:

* "when is my dentist appointment"
* "what day is project alpha due"
* "when did I finish workout plan"
* "deadline for report"

Key signal:
👉 The user mentions ONE specific task and asks *when*.

---

### 3. \`information_retrieval\`

The user wants to **retrieve stored knowledge/content** from notes (not scheduling).

Includes:

* Passwords
* Addresses
* Ideas
* Stored facts
* General questions about saved notes

Examples:

* "my wifi password"
* "what did I write about marketing idea"
* "notes about diet plan"
* "my chatgpt password"

Key signal:
👉 The user wants information, not scheduling or dates.

---

## Disambiguation Rules

1. If the query asks **what/which tasks exist in a time range → \`task_list\`**

   * even if only one task may exist

2. If the query asks **when a specific task happens → \`date_lookup\`**

   * contains words: *when, what date, deadline, due*

3. If the query asks for **content inside notes → \`information_retrieval\`**

   * contains: password, idea, notes, information, details

4. If unclear:

   * Mentions time range → \`task_list\`
   * Mentions specific event date → \`date_lookup\`
   * Otherwise → \`information_retrieval\`

---

## Output format

Return ONLY valid JSON:

\`\`\`
{"intent":"task_list"}
{"intent":"date_lookup"}
{"intent":"information_retrieval"}
\`\`\`

No explanation. No extra text.

---

## Query

${query}

---
`;
};
