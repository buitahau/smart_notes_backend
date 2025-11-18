import { INDEX_NAME, DIMENSIONS } from "./config.js";
import { apiClient } from "./helper/fetch.js";
import {
  getVectorizeBaseUrl,
  getVectorizeIndexUrl,
} from "./helper/vectorize-helper.js";

class CloudFlareVectorizeService {
  constructor() {
    this.context = this.createContext();
  }

  createContext = () => {
    return {
      env: {
        CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN,
        CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID,
      },
    };
  };

  async createIndex() {
    return apiClient.post(
      this.context,
      getVectorizeBaseUrl(this.context),
      {
        name: INDEX_NAME,
        config: {
          dimensions: DIMENSIONS,
          metric: "cosine",
        },
      }
    );
  }

  async createMetadataIndex() {
    const metadataFields = [
      {
        indexType: "string",
        propertyName: "noteId",
      },
      {
        indexType: "string",
        propertyName: "userId",
      },
      {
        indexType: "string",
        propertyName: "dateAt",
      },
    ];

    const metadataUrl = `${getVectorizeIndexUrl(
      this.context
    )}/metadata_index/create`;

    for (const field of metadataFields) {
      const { propertyName, indexType } = field;
      const payload = {
        indexType,
        propertyName,
      };

      const result = await apiClient.post(this.context, metadataUrl, payload);
      if (result.error) {
        throw new Error(`Failed to create metadata index for ${propertyName}: ${result.error}`);
      }
    }

    return { success: true };
  }

  async deleteIndex(indexName) {
    if (!indexName) {
      throw new Error("Index name is required");
    }

    return apiClient.delete(
      this.context,
      `${getVectorizeBaseUrl(this.context)}${indexName}`
    );
  }

  async listMetadataIndex() {
    return apiClient.get(
      this.context,
      `${getVectorizeIndexUrl(this.context)}/metadata_index/list`
    );
  }

  async insertVector(noteId, userId, dateAtTimestamp, values) {
    const vectorPayload = this._buildVectorPayload(noteId, userId, dateAtTimestamp, values);

    return apiClient.postNdjson(
      this.context,
      `${getVectorizeIndexUrl(this.context)}/insert`,
      vectorPayload
    );
  }

  async upsertVector(noteId, userId, dateAtTimestamp, values) {
    const vectorPayload = this._buildVectorPayload(noteId, userId, dateAtTimestamp, values);

    return apiClient.postNdjson(
      this.context,
      `${getVectorizeIndexUrl(this.context)}/upsert`,
      vectorPayload
    );
  }

  async deleteVectorById(noteId) {
    return apiClient.post(
      this.context,
      `${getVectorizeIndexUrl(this.context)}/delete_by_ids`,
      { ids: [noteId] }
    );
  }

  _buildVectorPayload(noteId, userId, dateAtTimestamp, values) {
    return {
      id: noteId,
      values,
      metadata: {
        noteId,
        userId,
        dateAt: dateAtTimestamp,
      },
    };
  }
}

export default CloudFlareVectorizeService;
