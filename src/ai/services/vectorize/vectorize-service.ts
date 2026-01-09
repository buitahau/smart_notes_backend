import { Note } from '@/models/Note.js';
import CloudFlareVectorizeService from './cloud-flare/cloud-flare-vectorize-service.js';

let serviceInstance = null;
const getServiceInstance = () => {
  if (!serviceInstance) {
    serviceInstance = new CloudFlareVectorizeService();
  }
  return serviceInstance;
};

export const createIndex = async () => {
  return getServiceInstance().createIndex();
};

export const createMetadataIndex = async () => {
  return getServiceInstance().createMetadataIndex();
};

export const deleteIndex = async indexName => {
  return getServiceInstance().deleteIndex(indexName);
};

export const listMetadataIndex = async () => {
  return getServiceInstance().listMetadataIndex();
};

export const insertVector = async (note: Note, dateAtTimestamp, values) => {
  return getServiceInstance().insertVector(
    note.id,
    note.userId,
    note.category,
    dateAtTimestamp,
    values
  );
};

export const upsertVector = async (note: Note, dateAtTimestamp, values) => {
  return getServiceInstance().upsertVector(
    note.id,
    note.userId,
    note.category,
    dateAtTimestamp,
    values
  );
};

export const deleteVectorById = async noteId => {
  return getServiceInstance().deleteVectorById(noteId);
};
