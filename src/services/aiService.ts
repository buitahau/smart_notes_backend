import AdapterFactory from '../ai/adapters/adapterFactory.js';
import { queryTaskList as queryTaskListFunction } from '../ai/services/query/queryTaskList.js';
import { queryDateLookup as queryDateLookupFunction } from '../ai/services/query/queryDateLookup.js';
import {
  insertNote as insertNoteFunction,
  updateNote as updateNoteFunction,
  deleteNote as deleteNoteFunction,
} from '../ai/services/note-service.js';
import ProviderEnum from '../ai/adapters/ProviderEnum.js';
import Note from '@/models/Note.js';

// Create context for Node.js environment
const createContext = (note: Note) => {
  return {
    env: {
      AI: {
        run: async (model, input) => {
          // Placeholder for embedding generation
          // In a real implementation, you would use an embedding service
          throw new Error(
            'AI embedding service not configured for Node.js environment'
          );
        },
      },
      CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN,
      CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    },
    req: {
      json: async () =>
        note.id ? {
          noteId: note.id,
          content: note.content,
          userId: note.userId,
          category: note.category,
          dateAt: note.dateAt || null
        }
          : { userId: note.userId, query: note.content },
    },
    json: data => data,
  };
};

class AIService {
  constructor() {
    // Initialize adapter factory if needed
    try {
      AdapterFactory.initialize();
    } catch (error) {
      console.warn('AdapterFactory initialization failed:', error.message);
    }
  }

  async classifyQuery(query) {
    try {
      // Try to use the AI adapter first
      const queryAdapter = AdapterFactory.getQueryAdapter(ProviderEnum.GEMINI);
      const result = await queryAdapter.classifyQuery(query);
      console.log('AI classification result:', result);
      return result;
    } catch (error) {
      throw new Error(
        'AI classification failed. Please try again.',
        error.message
      );
    }
  }

  async extractDateFilter(query) {
    if (!query || typeof query !== 'string') {
      return {};
    }

    try {
      const queryAdapter = AdapterFactory.getQueryAdapter(ProviderEnum.GEMINI);
      return await queryAdapter.extractDatesFromQuery(query);
    } catch (error) {
      console.error('Error extracting date filter from query:', error);
      return {};
    }
  }

  async queryTaskList(userId, query) {
    try {
      // Call the actual queryTaskList function from queryTaskList.js
      return await queryTaskListFunction(userId, query);
    } catch (error) {
      console.error('Error in queryTaskList:', error);
      // Fallback to empty array if vector search fails
      console.warn('Vector search failed, returning empty array');
      return [];
    }
  }

  async queryDateLookup(userId, query) {
    try {
      console.log('AIService.queryDateLookup: ' + userId + '/' + query);

      const context = createContext(userId, query);

      // Call the actual queryDateLookup function from queryDateLookup.js
      const result = await queryDateLookupFunction(context);

      // Extract note IDs from the result
      if (result && result.json) {
        const noteIds = await result.json();
        return noteIds;
      }

      return [];
    } catch (error) {
      console.error('Error in queryDateLookup:', error);
      // Fallback to empty array if vector search fails
      console.warn('Vector search failed, returning empty array');
      return [];
    }
  }

  async insertNote(note: Note) {
    try {
      console.log('AIService.insertNote: ' + note.id + '/' + note.userId);

      // Call the actual insertNote function from insert.js
      await insertNoteFunction(note);

      return { success: true, note };
    } catch (error) {
      console.error('Error inserting note:', error);
      return { success: false, note };
    }
  }

  async updateNote(note: Note) {
    try {
      await updateNoteFunction(note);
      return { success: true, noteId: note.id };
    } catch (error) {
      console.error('Error updating note:', error);
      return { success: false, noteId: note.id };
    }
  }

  async deleteNote(noteId: string) {
    try {
      await deleteNoteFunction(noteId);
      return { success: true, noteId };
    } catch (error) {
      console.error('Error deleting note:', error);
      return { success: false, noteId };
    }
  }
}

export default new AIService();
