import IntentEnum from '../enums/IntentEnum.js';

/**
 * Base AI Response class
 */
class AIResponse {
  constructor(intent, data, success = true, error = null) {
    this.intent = intent;
    this.data = data;
    this.success = success;
    this.error = error;
    this.timestamp = new Date().toISOString();
  }

  static createError(intent, error) {
    return new AIResponse(intent, null, false, error);
  }
}

/**
 * Task List Response
 */
class TaskListResponse extends AIResponse {
  constructor(notes, success = true, error = null) {
    super(IntentEnum.TASK_LIST, notes, success, error);
  }
}

/**
 * Date Lookup Response
 */
class DateLookupResponse extends AIResponse {
  constructor(dateInfo, success = true, error = null) {
    super(IntentEnum.DATE_LOOKUP, dateInfo, success, error);
  }
}

/**
 * Classification Response
 */
class ClassificationResponse extends AIResponse {
  constructor(intent, success = true, error = null) {
    super(intent, { intent }, success, error);
  }
}

/**
 * Response factory
 */
class AIResponseFactory {
  static create(intent, data, success = true, error = null) {
    switch (intent) {
      case IntentEnum.TASK_LIST:
        return new TaskListResponse(data, success, error);
      case IntentEnum.DATE_LOOKUP:
        return new DateLookupResponse(data, success, error);
      default:
        return new AIResponse(intent, data, success, error);
    }
  }

  static createClassification(intent, success = true, error = null) {
    return new ClassificationResponse(intent, success, error);
  }
}

export {
  AIResponse,
  TaskListResponse,
  DateLookupResponse,
  ClassificationResponse,
  AIResponseFactory,
};
