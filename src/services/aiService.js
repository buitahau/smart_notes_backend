import AdapterFactory from '../ai/adapters/adapterFactory.js';
import { queryTaskList as queryTaskListFunction } from '../ai/services/query/queryTaskList.js';
import { queryDateLookup as queryDateLookupFunction } from '../ai/services/query/queryDateLookup.js';
import { insertNote as insertNoteFunction ,
  updateNote as updateNoteFunction,
  deleteNote as deleteNoteFunction} from '../ai/services/note-service.js';

// Create context for Node.js environment
const createContext = (userId, query, noteId, content, dateAt) => {
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
        noteId ? { noteId, content, userId, dateAt } : { userId, query },
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
      const queryAdapter = AdapterFactory.getQueryAdapter();
      const result = await queryAdapter.classifyQuery(query);
      console.log('AI classification result:', result);
      return result;
    } catch (error) {
      throw new Error("AI classification failed. Please try again.", error.message);
    }
  }

  async queryTaskList(userId, query) {
    try {
      const context = createContext(userId, query);

      // Call the actual queryTaskList function from queryTaskList.js
      return await queryTaskListFunction(context);
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

  async insertNote(noteId, content, userId, dateAt) {
    try {
      console.log('AIService.insertNote: ' + noteId + '/' + userId);

      const context = createContext(userId, null, noteId, content, dateAt);

      // Call the actual insertNote function from insert.js
      const result = await insertNoteFunction(context);

      // Extract the result from the response
      if (result && result.json) {
        const insertResult = await result.json();
        return insertResult;
      }

      return { success: true, noteId };
    } catch (error) {
      console.error('Error inserting note:', error);
      // Fallback to mock success if vector insertion fails
      console.warn('Vector insertion failed, returning mock success');
      return { success: true, noteId };
    }
  }

  async updateNote(noteId, updateData) {
    try {
      const { userId, content, dateAt } = updateData || {};

      if (!noteId || !userId) {
        throw new Error('noteId and userId are required to update note');
      }

      const hasContentUpdate =
        typeof content === 'string' && content.trim().length > 0;
      const hasDateUpdate = Boolean(dateAt);

      if (!hasContentUpdate && !hasDateUpdate) {
        // Nothing meaningful to sync with the vector index
        return { success: true, noteId, skipped: true };
      }

      const context = createContext(
        userId,
        null,
        noteId,
        hasContentUpdate ? content : '',
        hasDateUpdate ? dateAt : null
      );

      const result = await updateNoteFunction(context);

      if (result && result.json) {
        const updateResult = await result.json();
        return updateResult;
      }

      return { success: true, noteId };
    } catch (error) {
      console.error('Error updating note:', error);
      console.warn('Vector update failed, returning mock success');
      return { success: true, noteId };
    }
  }

  async deleteNote(noteId) {
    try {
      if (!noteId) {
        throw new Error('noteId is required to delete note');
      }

      const context = createContext(null, null, noteId);
      const result = await deleteNoteFunction(context);

      if (result && result.json) {
        const deleteResult = await result.json();
        return deleteResult;
      }

      return { success: true, noteId };
    } catch (error) {
      console.error('Error deleting note:', error);
      console.warn('Vector delete failed, returning mock success');
      return { success: true, noteId };
    }
  }
}

export default new AIService();
