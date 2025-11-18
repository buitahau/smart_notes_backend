import crypto from 'crypto';
import { noteRepository } from '../database/noteRepository.js';
import aiService from './aiService.js';

class NoteService {
  async createNote(userId, content, dateAt) {
    dateAt = new Date(new Date(dateAt).setUTCHours(0, 0, 0, 0)).toISOString();
    try {
      const noteData = {
        id: crypto.randomUUID(),
        userId: userId,
        content: content,
        dateAt: dateAt,
      };

      const note = await noteRepository.create(noteData);

      // Fire and forget AI vector insert so note creation isn't blocked
      aiService
        .insertNote(note.id, content, userId, dateAt)
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

  async updateNote(noteId, userId, content, dateAt = null) {
    try {
      // First verify the note exists and belongs to the user
      const existingNote = await noteRepository.getById(noteId);
      if (!existingNote || existingNote.userId !== userId) {
        return {
          success: false,
          error: 'Note not found or access denied',
        };
      }

      const updateData = {};
      // Only send fields that truly changed to the repository update
      if (typeof content === 'string' && content !== existingNote.content) {
        updateData.content = content;
      }

      if (dateAt !== null) {
        const incomingDate = dateAt instanceof Date ? dateAt : new Date(dateAt);
        const existingDate = existingNote.dateAt;
        const existingTime =
          existingDate instanceof Date && !isNaN(existingDate.getTime())
            ? existingDate.getTime()
            : null;
        const incomingTime =
          incomingDate instanceof Date && !isNaN(incomingDate.getTime())
            ? incomingDate.getTime()
            : null;

        if (incomingTime !== null && incomingTime !== existingTime) {
          updateData.dateAt = new Date(
            new Date(incomingTime).setUTCHours(0, 0, 0, 0)
          ).toISOString();
        }
      }

      if (Object.keys(updateData).length === 0) {
        return {
          success: true,
          note: existingNote,
        };
      }

      const updatedNote = await noteRepository.update(noteId, updateData);
      if (!updatedNote) {
        return {
          success: false,
          error: 'Failed to update note',
        };
      }
      aiService
        .updateNote(updatedNote.id, {
          userId: updatedNote.userId,
          content: updatedNote.content,
          dateAt: updatedNote.dateAt,
        })
        .catch(err => console.error('updateNote async error', err));

      return {
        success: true,
        note: updatedNote,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async deleteNote(noteId, userId) {
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
}

export default new NoteService();
