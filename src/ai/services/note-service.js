import { convertDateToTimestamp } from '../utils/date.js';
import { createEmbedding } from './embedding-service.js';
import {
  insertVector,
  upsertVector,
  deleteVectorById,
} from './vectorize/vectorize-service.js';

export const insertNote = async c => {
  const { noteId, content, userId, dateAt } = await c.req.json();
  if (!noteId || !userId || !content || !dateAt) {
    return c.json(
      { error: 'Missing fields: noteId, content, userId, dateAt' },
      400
    );
  }
  const dateAtTimestmp = convertDateToTimestamp(dateAt);

  const embedding = await createEmbedding(content);

  const result = await insertVector(
    noteId,
    userId,
    dateAtTimestmp,
    embedding
  );
  return c.json(result);
};

export const updateNote = async c => {
  const { noteId, content, userId, dateAt } = await c.req.json();

  if (!noteId || !userId) {
    return c.json(
      { error: 'Missing fields: noteId and userId are required' },
      400
    );
  }

  const dateAtTimestamp = convertDateToTimestamp(dateAt);
  const embedding = await createEmbedding(content);

  const result = await upsertVector(
    noteId,
    userId,
    dateAtTimestamp,
    embedding
  );

  return c.json(result);
};


export const deleteNote = async c => {
  const { noteId } = await c.req.json();

  if (!noteId) {
    return c.json({ error: 'Missing fields: noteId is required' }, 400);
  }

  const result = await deleteVectorById(noteId);

  return c.json(result);
};
