import { notes } from './schema/note.js';
import { eq, inArray } from 'drizzle-orm';
import Note from '../models/Note.js';
import { db } from './client.js';

const mapRowToNote = row => {
  return new Note(
    row.id,
    row.userId,
    row.content,
    new Date(row.dateAt),
    new Date(row.createdAt)
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

  // Update a note
  async update(id, updateData) {
    const updateValues = {};
    if (updateData.content !== undefined)
      updateValues.content = updateData.content;
    if (updateData.dateAt !== undefined)
      updateValues.dateAt = updateData.dateAt;

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
