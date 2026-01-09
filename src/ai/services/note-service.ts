import { convertDateToTimestamp } from '../utils/date.js';
import { createEmbedding } from './embedding-service.js';
import {
  insertVector,
  upsertVector,
  deleteVectorById,
} from './vectorize/vectorize-service.js';
import Note from '@/models/Note.js';

export const insertNote = async (note: Note) => {
  const dateAtTimestmp = convertDateToTimestamp(note.dateAt);
  const embedding = await createEmbedding(note.content);
  await insertVector(note, dateAtTimestmp, embedding);
};

export const updateNote = async (note: Note) => {
  const dateAtTimestamp = convertDateToTimestamp(note.dateAt);
  const embedding = await createEmbedding(note.content);
  await upsertVector(note, dateAtTimestamp, embedding);
};

export const deleteNote = async (noteId: string) => {
  await deleteVectorById(noteId);
};
