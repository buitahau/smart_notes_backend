import { z } from 'zod';
import IntentEnum from '../enums/IntentEnum.js';

/**
 * AI Response schema
 */
export const AIResponseSchema = z.object({
    intent: z.string(),
    data: z.any().nullable(),
    success: z.boolean(),
    error: z.string().nullable(),
    timestamp: z.string(),
});

export type AIResponseType = z.infer<typeof AIResponseSchema>;

/**
 * Base AI Response class
 */
class AIResponse {
    intent: string;
    data: any;
    success: boolean;
    error: string | null;
    timestamp: string;

    constructor(intent: string, data: any, success: boolean = true, error: string | null = null) {
        this.intent = intent;
        this.data = data;
        this.success = success;
        this.error = error;
        this.timestamp = new Date().toISOString();
    }

    static createError(intent: string, error: string): AIResponse {
        return new AIResponse(intent, null, false, error);
    }
}

/**
 * Task List Response
 */
class TaskListResponse extends AIResponse {
    constructor(notes: any, success: boolean = true, error: string | null = null) {
        super(IntentEnum.TASK_LIST, notes, success, error);
    }
}

/**
 * Date Lookup Response
 */
class DateLookupResponse extends AIResponse {
    constructor(dateInfo: any, success: boolean = true, error: string | null = null) {
        super(IntentEnum.DATE_LOOKUP, dateInfo, success, error);
    }
}

/**
 * Classification Response
 */
class ClassificationResponse extends AIResponse {
    constructor(intent: string, success: boolean = true, error: string | null = null) {
        super(intent, { intent }, success, error);
    }
}

/**
 * Response factory
 */
class AIResponseFactory {
    static create(intent: string, data: any, success: boolean = true, error: string | null = null): AIResponse {
        switch (intent) {
            case IntentEnum.TASK_LIST:
                return new TaskListResponse(data, success, error);
            case IntentEnum.DATE_LOOKUP:
                return new DateLookupResponse(data, success, error);
            default:
                return new AIResponse(intent, data, success, error);
        }
    }

    static createClassification(intent: string, success: boolean = true, error: string | null = null): ClassificationResponse {
        return new ClassificationResponse(intent, success, error);
    }

    static createError(intent: string, error: string): AIResponse {
        return new AIResponse(intent, null, false, error);
    }
}

export {
    AIResponse,
    TaskListResponse,
    DateLookupResponse,
    ClassificationResponse,
    AIResponseFactory,
};
