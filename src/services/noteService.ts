import crypto from 'crypto';
import { noteRepository } from '../database/noteRepository.js';
import aiService from './aiService.js';
import Note from '@/models/Note.js';

const convertFilterValueToDate = value => {
  if (value === undefined || value === null) {
    return null;
  }

  if (value instanceof Date && !isNaN(value.getTime())) {
    return new Date(value.getTime());
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    const millis = value < 1e12 ? value * 1000 : value;
    const date = new Date(millis);
    return isNaN(date.getTime()) ? null : date;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return null;
    }

    const numericValue = Number(trimmed);
    if (!isNaN(numericValue)) {
      const millis = numericValue < 1e12 ? numericValue * 1000 : numericValue;
      const numericDate = new Date(millis);
      return isNaN(numericDate.getTime()) ? null : numericDate;
    }

    const parsed = new Date(trimmed);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
};

const startOfDayUTC = date => {
  const normalized = new Date(date);
  normalized.setUTCHours(0, 0, 0, 0);
  return normalized;
};

const endOfDayUTC = date => {
  const normalized = new Date(date);
  normalized.setUTCHours(23, 59, 59, 999);
  return normalized;
};

const normalizeDateFilter = rawFilter => {
  if (!rawFilter || typeof rawFilter !== 'object') {
    return {};
  }

  if (rawFilter.$exists) {
    return {};
  }

  const normalized = {};

  const eqDate = convertFilterValueToDate(rawFilter.$eq);
  if (eqDate) {
    normalized.eq = startOfDayUTC(eqDate);
    return normalized;
  }

  const gteDate = convertFilterValueToDate(rawFilter.$gte);
  if (gteDate) {
    normalized.gte = startOfDayUTC(gteDate);
  }

  const lteDate = convertFilterValueToDate(rawFilter.$lte);
  if (lteDate) {
    normalized.lte = endOfDayUTC(lteDate);
  }

  return normalized;
};

class NoteService {
  async createNote(note: Note) {
    try {
      note.id = crypto.randomUUID();
      if (note.dateAt) {
        note.dateAt = new Date(new Date(note.dateAt).setUTCHours(0, 0, 0, 0));
      }

      note = await noteRepository.create(note);

      // Fire and forget AI vector insert so note creation isn't blocked
      // Only pass dateAt to AI service if it's not null
      aiService
        .insertNote(note)
        .catch(err => console.error('insertNote async error', err));

      return {
        success: true,
        note: note,
      };
    } catch (error) {
      console.error(error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async getNotesByUserId(userId, limit = 50, offset = 0) {
    try {
      const notes = await noteRepository.getByUserId(userId);

      // Apply pagination and sorting
      const sortedNotes = notes.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      const paginatedNotes = sortedNotes.slice(offset, offset + limit);

      return {
        success: true,
        notes: paginatedNotes,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async getNoteById(noteId, userId) {
    try {
      const note = await noteRepository.getById(noteId);

      // Verify the note belongs to the user
      if (!note || note.userId !== userId) {
        return {
          success: false,
          error: 'Note not found or access denied',
        };
      }

      return {
        success: true,
        note: note,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async updateNote(note: Note) {
    try {
      // First verify the note exists and belongs to the user
      let existingNote = await noteRepository.getById(note.id);
      if (!existingNote || existingNote.userId !== note.userId) {
        return {
          success: false,
          error: 'Note not found or access denied',
        };
      }

      existingNote.category = note.category;
      existingNote.content = note.content;
      existingNote.dateAt = note.dateAt;

      existingNote = await noteRepository.update(note.id, existingNote);
      if (!existingNote) {
        return {
          success: false,
          error: 'Failed to update note',
        };
      }

      // aiService
      aiService
        .updateNote(existingNote)
        .catch(err => console.error('updateNote async error', err));

      return {
        success: true,
        note: existingNote,
      };
    } catch (error) {
      console.error(error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async deleteNote(noteId: string, userId: string) {
    try {
      // First verify the note exists and belongs to the user
      const existingNote = await noteRepository.getById(noteId);
      if (!existingNote || existingNote.userId !== userId) {
        return {
          success: false,
          error: 'Note not found or access denied',
        };
      }

      await noteRepository.delete(noteId);
      aiService
        .deleteNote(noteId)
        .catch(err => console.error('deleteNote async error', err));

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async getNotesByIds(noteIds, userId) {
    try {
      if (!noteIds || !Array.isArray(noteIds) || noteIds.length === 0) {
        return {
          success: true,
          notes: [],
        };
      }

      const notes = await noteRepository.getByIds(noteIds);

      // Filter to only include notes that belong to the user
      const userNotes = notes.filter(note => note.userId === userId);

      return {
        success: true,
        notes: userNotes,
      };
    } catch (error) {
      console.error('Error fetching notes by IDs:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async getNotesByDateFilter(userId, rawDateFilter) {
    try {
      if (!userId) {
        return {
          success: false,
          error: 'User ID is required',
        };
      }

      const normalizedFilter = normalizeDateFilter(rawDateFilter);
      const notes = await noteRepository.getByUserIdAndDateFilter(
        userId,
        normalizedFilter
      );

      return {
        success: true,
        notes,
      };
    } catch (error) {
      console.error('Error fetching notes by date filter:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

export default new NoteService();
