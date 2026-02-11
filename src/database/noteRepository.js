import { notes } from './schema/note.js';
import { and, desc, eq, gte, inArray, lte } from 'drizzle-orm';
import Note from '../models/Note.js';
import { db } from './client.js';

const mapRowToNote = row => {
  return new Note(
    row.id,
    row.userId,
    row.content,
    new Date(row.dateAt),
    new Date(row.createdAt),
    row.category,
    row.status
  );
};

export const noteRepository = {
  // Create a new note
  async create(noteData) {
    const [newNote] = await db
      .insert(notes)
      .values({
        id: noteData.id,
        userId: noteData.userId,
        content: noteData.content,
        dateAt: new Date(noteData.dateAt),
        category: noteData.category,
        status: noteData.status,
      })
      .returning();

    return mapRowToNote(newNote);
  },

  // Get note by ID
  async getById(id) {
    const noteRows = await db.select().from(notes).where(eq(notes.id, id));
    if (!noteRows || noteRows.length === 0) return null;

    return mapRowToNote(noteRows[0]);
  },

  // Get all notes
  async getAll() {
    const allNoteRows = await db.select().from(notes);
    return allNoteRows.map(mapRowToNote);
  },

  // Get notes by user ID
  async getByUserId(userId) {
    const userNoteRows = await db
      .select()
      .from(notes)
      .where(eq(notes.userId, userId));
    return userNoteRows.map(mapRowToNote);
  },
  async getByUserIdAndDateFilter(userId, dateFilter = {}) {
    if (!userId) {
      return [];
    }

    const filters = [eq(notes.userId, userId)];

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

    return userNoteRows.map(mapRowToNote);
  },

  // Update a note
  async update(id, updateData) {
    const updateValues = {};
    if (updateData.content !== undefined)
      updateValues.content = updateData.content;
    if (updateData.dateAt !== undefined)
      updateValues.dateAt = new Date(updateData.dateAt);
    if (updateData.category !== undefined)
      updateValues.category = updateData.category;
    if (updateData.status !== undefined)
      updateValues.status = updateData.status;

    const [updatedNote] = await db
      .update(notes)
      .set(updateValues)
      .where(eq(notes.id, id))
      .returning();

    if (!updatedNote) return null;

    return mapRowToNote(updatedNote);
  },

  // Delete a note
  async delete(id) {
    const [deletedNote] = await db
      .delete(notes)
      .where(eq(notes.id, id))
      .returning();

    if (!deletedNote) return null;

    return mapRowToNote(deletedNote);
  },

  // Get notes by list of IDs
  async getByIds(ids) {
    if (!ids || ids.length === 0) return [];

    const foundNoteRows = await db
      .select()
      .from(notes)
      .where(inArray(notes.id, ids));

    return foundNoteRows.map(mapRowToNote);
  },
};
