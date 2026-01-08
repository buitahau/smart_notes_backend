import { z } from 'zod';

/**
 * Note category enum
 */
export const NoteCategorySchema = z.enum(['general', 'on-a-date']);
export type NoteCategory = z.infer<typeof NoteCategorySchema>;

/**
 * Note schema for validation
 */
export const NoteSchema = z.object({
    id: z.string(),
    userId: z.string(),
    content: z.string(),
    category: NoteCategorySchema,
    dateAt: z.date().nullable(),
    createdAt: z.date(),
});

/**
 * Note type inferred from schema
 */
export type Note = z.infer<typeof NoteSchema>;

/**
 * Note class for business logic
 */
class NoteClass {
    id: string;
    userId: string;
    content: string;
    category: NoteCategory;
    dateAt: Date | null;
    createdAt: Date;

    constructor(
        id: string,
        userId: string,
        content: string,
        dateAt: Date | null,
        createdAt: Date = new Date(),
        category: NoteCategory = 'general'
    ) {
        this.id = id;
        this.userId = userId;
        this.content = content;
        this.category = category;
        this.dateAt = dateAt;
        this.createdAt = createdAt;
    }

    static from(content: string, category: NoteCategory, dateAt: Date | null) {
        return new NoteClass(
            null,
            null,
            content,
            dateAt,
            null,
            category
        )
    }

    toJSON(): Note {
        return {
            id: this.id,
            userId: this.userId,
            content: this.content,
            category: this.category,
            dateAt: this.dateAt,
            createdAt: this.createdAt,
        };
    }
}

export default NoteClass;
