import CloudFlareVectorizeService from "./cloud-flare/cloud-flare-vectorize-service.js";

let serviceInstance = null;
const getServiceInstance = () => {
  if (!serviceInstance) {
    serviceInstance = new CloudFlareVectorizeService();
  }
  return serviceInstance;
}

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

export const insertVector = async (noteId, userId, dateAtTimestamp, values) => {
  return getServiceInstance().insertVector(
    noteId,
    userId,
    dateAtTimestamp,
    values
  );
};

export const upsertVector = async (noteId, userId, dateAtTimestamp, values) => {
  return getServiceInstance().upsertVector(
    noteId,
    userId,
    dateAtTimestamp,
    values
  );
};

export const deleteVectorById = async noteId => {
  return getServiceInstance().deleteVectorById(noteId);
};
