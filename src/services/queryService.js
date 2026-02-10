import aiService from './aiService.js';
import noteService from './noteService.js';
import IntentEnum from '../enums/IntentEnum.js';
import { AIResponseFactory } from '../models/AIResponse.js';

class QueryService {
  async query(userId, query) {
    try {
      // Get intent from AI service
      const intentResponse = await aiService.classifyQuery(query);
      const intent = intentResponse.intent || IntentEnum.UNKNOWN;
      // Route based on intent
      switch (intent) {
        case IntentEnum.TASK_LIST:
          return await this.queryTaskList(userId, query);
        case IntentEnum.DATE_LOOKUP:
          return await this.queryDateLookup(userId, query);
        case IntentEnum.INFORMATION_RETRIEVAL:
          return await this.queryInformationRetrieval(userId, query);
        default:
          // Default to task list for unknown intents
          return await this.queryTaskList(userId, query);
      }
    } catch (error) {
      console.error('Error in query service:', error);
      throw error; // Re-throw to be handled by the controller
    }
  }

  async queryDateLookup(userId, query) {
    try {
      // Get note IDs from AI service
      console.log('QueryService.queryDateLookup: ' + userId + '/' + query);
      const noteIds = await aiService.queryDateLookup(userId, query);

      // Get notes by their IDs
      const { success, notes, error } = await noteService.getNotesByIds(
        noteIds,
        userId
      );

      if (!success) {
        return AIResponseFactory.createError(
          IntentEnum.DATE_LOOKUP,
          error || 'Failed to fetch notes'
        );
      }

      return AIResponseFactory.create(IntentEnum.DATE_LOOKUP, notes || []);
    } catch (error) {
      console.error('Error in date lookup query:', error);
      return AIResponseFactory.createError(
        IntentEnum.DATE_LOOKUP,
        error.message
      );
    }
  }

  async queryTaskList(userId, query) {
    try {
      const dateFilter = await aiService.extractDateFilter(query);
      const { success, notes, error } = await noteService.getNotesByDateFilter(
        userId,
        dateFilter
      );

      if (!success) {
        return AIResponseFactory.createError(
          IntentEnum.TASK_LIST,
          error || 'Failed to fetch notes'
        );
      }

      return AIResponseFactory.create(IntentEnum.TASK_LIST, notes || []);
    } catch (error) {
      console.error('Error in task list query:', error);
      return AIResponseFactory.createError(IntentEnum.TASK_LIST, error.message);
    }
  }

  async queryInformationRetrieval(userId, query) {
    try {
      console.log(
        'QueryService.queryInformationRetrieval: ' + userId + '/' + query
      );
      // For now, information retrieval acts similar to vector search but logically separated
      // In the future, this could involve RAG (Retrieval Augmented Generation)
      const noteIds = await aiService.queryInformationRetrieval(userId, query);

      // Get notes by their IDs
      const { success, notes, error } = await noteService.getNotesByIds(
        noteIds,
        userId
      );

      if (!success) {
        return AIResponseFactory.createError(
          IntentEnum.INFORMATION_RETRIEVAL,
          error || 'Failed to fetch notes'
        );
      }

      return AIResponseFactory.create(
        IntentEnum.INFORMATION_RETRIEVAL,
        notes || []
      );
    } catch (error) {
      console.error('Error in information retrieval query:', error);
      return AIResponseFactory.createError(
        IntentEnum.INFORMATION_RETRIEVAL,
        error.message
      );
    }
  }
}

export default new QueryService();
