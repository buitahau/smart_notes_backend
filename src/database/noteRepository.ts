import { notes } from './schema/note';
import { and, desc, eq, gte, inArray, lte, SQL } from 'drizzle-orm';
import Note from '../models/Note';
import { db } from './client';

interface NoteRow {
    id: string;
    userId: string;
    content: string;
    category: string;
    dateAt: Date | null;
    createdAt: Date;
}

interface DateFilter {
    eq?: Date;
    gte?: Date;
    lte?: Date;
}

interface NoteUpdateData {
    content?: string;
    category?: string;
    dateAt?: Date | null;
}

const mapRowToNote = (row: NoteRow): Note => {
    return new Note(
        row.id,
        row.userId,
        row.content,
        row.dateAt ? new Date(row.dateAt) : null,
        new Date(row.createdAt),
        row.category as 'general' | 'on-a-date'
    );
};

export const noteRepository = {
    // Create a new note
    async create(noteData: Note): Promise<Note> {
        noteData.createdAt = new Date();
        const [newNote] = await db
            .insert(notes)
            .values(noteData)
            .returning();

        return mapRowToNote(newNote as NoteRow);
    },

    // Get note by ID
    async getById(id: string): Promise<Note | null> {
        const noteRows = await db.select().from(notes).where(eq(notes.id, id));
        if (!noteRows || noteRows.length === 0) return null;

        return mapRowToNote(noteRows[0] as NoteRow);
    },

    // Get all notes
    async getAll(): Promise<Note[]> {
        const allNoteRows = await db.select().from(notes);
        return allNoteRows.map(row => mapRowToNote(row as NoteRow));
    },

    // Get notes by user ID
    async getByUserId(userId: string): Promise<Note[]> {
        const userNoteRows = await db
            .select()
            .from(notes)
            .where(eq(notes.userId, userId));
        return userNoteRows.map(row => mapRowToNote(row as NoteRow));
    },

    async getByUserIdAndDateFilter(userId: string, dateFilter: DateFilter = {}): Promise<Note[]> {
        if (!userId) {
            return [];
        }

        const filters: SQL[] = [eq(notes.userId, userId)];

        if (dateFilter && dateFilter.eq) {
            filters.push(eq(notes.dateAt, dateFilter.eq));
        } else {
            if (dateFilter && dateFilter.gte) {
                filters.push(gte(notes.dateAt, dateFilter.gte));
            }

            if (dateFilter && dateFilter.lte) {
                filters.push(lte(notes.dateAt, dateFilter.lte));
            }
        }

        const whereCondition =
            filters.length === 1 ? filters[0] : and(...filters);

        const userNoteRows = await db
            .select()
            .from(notes)
            .where(whereCondition)
            .orderBy(desc(notes.dateAt));

        return userNoteRows.map(row => mapRowToNote(row as NoteRow));
    },

    // Update a note
    async update(id: string, updateData: NoteUpdateData): Promise<Note | null> {
        const [updatedNote] = await db
            .update(notes)
            .set(updateData)
            .where(eq(notes.id, id))
            .returning();

        if (!updatedNote) return null;

        return mapRowToNote(updatedNote as NoteRow);
    },

    // Delete a note
    async delete(id: string): Promise<Note | null> {
        const [deletedNote] = await db
            .delete(notes)
            .where(eq(notes.id, id))
            .returning();

        if (!deletedNote) return null;

        return mapRowToNote(deletedNote as NoteRow);
    },

    // Get notes by list of IDs
    async getByIds(ids: string[]): Promise<Note[]> {
        if (!ids || ids.length === 0) return [];

        const foundNoteRows = await db
            .select()
            .from(notes)
            .where(inArray(notes.id, ids));

        return foundNoteRows.map(row => mapRowToNote(row as NoteRow));
    },
};
