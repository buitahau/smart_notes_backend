import { z } from 'zod';

/**
 * Create Note Request Schema
 */
export const CreateNoteSchema = z.object({
    content: z.string().min(1, 'Note content is required').max(10000, 'Note content exceeds maximum length of 10,000 characters'),
    category: z.enum(['general', 'on-a-date']).default('general'),
    date: z.string().datetime().optional(),
});

export type CreateNoteInput = z.infer<typeof CreateNoteSchema>;

/**
 * Update Note Request Schema
 */
export const UpdateNoteSchema = z.object({
    content: z.string().min(1, 'Note content is required').max(10000, 'Note content exceeds maximum length of 10,000 characters'),
    category: z.enum(['general', 'on-a-date']),
    date: z.string().datetime().optional(),
});

export type UpdateNoteInput = z.infer<typeof UpdateNoteSchema>;

/**
 * Get Notes Query Schema
 */
export const GetNotesQuerySchema = z.object({
    limit: z.string().optional().transform(val => val ? Math.min(Math.max(parseInt(val), 1), 100) : 50),
    offset: z.string().optional().transform(val => val ? Math.max(parseInt(val), 0) : 0),
    search: z.string().optional(),
    sortBy: z.string().optional().default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type GetNotesQuery = z.infer<typeof GetNotesQuerySchema>;
