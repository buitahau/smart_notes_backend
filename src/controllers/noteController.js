import noteService from '../services/noteService.js';

const MAX_NOTE_LENGTH = 10000;
const ONE_YEAR_IN_FUTURE = () => {
  const date = new Date();
  date.setFullYear(date.getFullYear() + 1);
  return date;
};

const validateAndNormalize = (content, date, category) => {

  const { ok, errorMessage, normalizeContent } = validateAndNormalizeContent(content);
  if (!ok) {
    return { ok, errorMessage };
  }

  const { ok: categoryOk, errorMessage: categoryErrorMessage, normalizeCategory } = validateAndNormalizeCategory(category);
  if (!categoryOk) {
    return { ok: false, errorMessage: categoryErrorMessage };
  }

  let normalizeDate = null;
  if (normalizeCategory != 'general') {
    const { ok: dateOk, errorMessage: dateErrorMessage, normalizeDate: normalizeDateValue } = validateAndNormalizeDate(date);
    if (!dateOk) {
      return { ok: false, errorMessage: dateErrorMessage };
    }
    normalizeDate = normalizeDateValue;
  }

  return { ok: true, normalizedData: { content: normalizeContent, dateAt: normalizeDate, category: normalizeCategory } };
};

const validateAndNormalizeContent = (content) => {
  if (!content || typeof content !== 'string' || content.trim() === '') {
    return { ok: false, errorMessage: 'Note content is required and must be a non-empty string' };
  }

  const trimmedContent = content.trim();
  if (trimmedContent.length > MAX_NOTE_LENGTH) {
    return { ok: false, errorMessage: 'Note content exceeds maximum length of 10,000 characters' };
  }

  return { ok: true, normalizeContent: trimmedContent };
};

const validateAndNormalizeCategory = (category) => {
  const validCategories = ['general', 'on-a-date'];
  const normalizedCategory = category || 'general';

  if (!validCategories.includes(normalizedCategory)) {
    return { ok: false, errorMessage: "Category must be either 'general' or 'on-a-date'" };
  }

  return { ok: true, normalizeCategory: normalizedCategory };
};

const validateAndNormalizeDate = (date) => {
  if (!date || typeof date !== 'string' || date.trim() === '') {
    return { ok: false, errorMessage: "Date is required for category 'on-a-date'" };
  }

  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) {
    return { ok: false, errorMessage: 'Invalid date format. Please use ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)' };
  }

  if (parsedDate > ONE_YEAR_IN_FUTURE()) {
    return { ok: false, errorMessage: 'Date cannot be more than one year in the future' };
  }

  return { ok: true, normalizeDate: parsedDate };
};

class NoteController {
  async createNote(c) {
    try {
      const { content, date, category } = await c.req.json();
      // Extract userId from authenticated user (set by authenticateToken middleware)
      const userId = c.get('user')?.id;

      // Enhanced validation
      if (!userId) {
        return c.json(
          {
            success: false,
            message: 'User authentication required',
          },
          401
        );
      }

      const { ok, errorMessage, normalizedData } = validateAndNormalize(content, date, category);

      if (!ok) {
        return c.json(
          {
            success: false,
            message: errorMessage,
          },
          400
        );
      }

      const result = await noteService.createNote(
        userId,
        normalizedData.content,
        normalizedData.dateAt,
        normalizedData.category
      );

      if (!result.success) {
        return c.json(
          {
            success: false,
            message: result.error || 'Failed to create note',
          },
          400
        );
      }

      return c.json(
        {
          success: true,
          message: 'Note created successfully',
          note: result.note,
        },
        201
      );
    } catch (error) {
      console.error('Error creating note:', error);
      return c.json(
        {
          success: false,
          message: 'Internal server error while creating note',
        },
        500
      );
    }
  }

  async getNotes(c) {
    try {
      // Extract userId from authenticated user (set by authenticateToken middleware)
      const userId = c.get('user')?.id;

      if (!userId) {
        return c.json(
          {
            success: false,
            message: 'User authentication required',
          },
          401
        );
      }

      // Enhanced pagination validation
      const limit = Math.min(
        Math.max(parseInt(c.req.query('limit')) || 50, 1),
        100
      );
      const offset = Math.max(parseInt(c.req.query('offset')) || 0, 0);

      // Optional search and filter parameters
      const search = c.req.query('search');
      const sortBy = c.req.query('sortBy') || 'createdAt';
      const sortOrder = c.req.query('sortOrder') || 'desc';

      const result = await noteService.getNotesByUserId(userId, limit, offset, {
        search: search?.trim(),
        sortBy,
        sortOrder,
      });

      if (!result.success) {
        return c.json(
          {
            success: false,
            message: result.error || 'Failed to retrieve notes',
          },
          400
        );
      }

      return c.json({
        success: true,
        notes: result.notes,
        pagination: {
          limit,
          offset,
          count: result.notes.length,
          hasMore: result.notes.length === limit,
        },
      });
    } catch (error) {
      console.error('Error retrieving notes:', error);
      return c.json(
        {
          success: false,
          message: 'Internal server error while retrieving notes',
        },
        500
      );
    }
  }

  async getNoteById(c) {
    try {
      const id = c.req.param('id');
      // Extract userId from authenticated user (set by authenticateToken middleware)
      const userId = c.get('user')?.id;

      if (!userId) {
        return c.json(
          {
            success: false,
            message: 'User authentication required',
          },
          401
        );
      }

      // Validate note ID
      if (!id || typeof id !== 'string' || id.trim() === '') {
        return c.json(
          {
            success: false,
            message: 'Valid note ID is required',
          },
          400
        );
      }

      const result = await noteService.getNoteById(id.trim(), userId);

      if (!result.success) {
        return c.json(
          {
            success: false,
            message: result.error || 'Note not found or access denied',
          },
          404
        );
      }

      return c.json({
        success: true,
        note: result.note,
      });
    } catch (error) {
      console.error('Error retrieving note by ID:', error);
      return c.json(
        {
          success: false,
          message: 'Internal server error while retrieving note',
        },
        500
      );
    }
  }

  async updateNote(c) {
    try {
      const id = c.req.param('id');
      const { content, date, category } = await c.req.json();
      // Extract userId from authenticated user (set by authenticateToken middleware)
      const userId = c.get('user')?.id;

      // Enhanced validation
      if (!userId) {
        return c.json(
          {
            success: false,
            message: 'User authentication required',
          },
          401
        );
      }

      // Validate note ID
      if (!id || typeof id !== 'string' || id.trim() === '') {
        return c.json(
          {
            success: false,
            message: 'Valid note ID is required',
          },
          400
        );
      }
      const { ok, errorMessage, normalizedData } = validateAndNormalize(content, date, category);

      if (!ok) {
        return c.json(
          {
            success: false,
            message: errorMessage,
          },
          400
        );
      }

      const result = await noteService.updateNote(
        id.trim(),
        userId,
        normalizedData.content,
        normalizedData.dateAt,
        normalizedData.category
      );

      if (!result.success) {
        return c.json(
          {
            success: false,
            message: result.error || 'Note not found or update failed',
          },
          404
        );
      }

      return c.json({
        success: true,
        message: 'Note updated successfully',
        note: result.note,
      });
    } catch (error) {
      console.error('Error updating note:', error);
      return c.json(
        {
          success: false,
          message: 'Internal server error while updating note',
        },
        500
      );
    }
  }

  async deleteNote(c) {
    try {
      const id = c.req.param('id');
      // Extract userId from authenticated user (set by authenticateToken middleware)
      const userId = c.get('user')?.id;

      // Enhanced validation
      if (!userId) {
        return c.json(
          {
            success: false,
            message: 'User authentication required',
          },
          401
        );
      }

      // Validate note ID
      if (!id || typeof id !== 'string' || id.trim() === '') {
        return c.json(
          {
            success: false,
            message: 'Valid note ID is required',
          },
          400
        );
      }

      const result = await noteService.deleteNote(id.trim(), userId);

      if (!result.success) {
        return c.json(
          {
            success: false,
            message: result.error || 'Note not found or delete failed',
          },
          404
        );
      }

      return c.json({
        success: true,
        message: 'Note deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting note:', error);
      return c.json(
        {
          success: false,
          message: 'Internal server error while deleting note',
        },
        500
      );
    }
  }
}

export default new NoteController();
