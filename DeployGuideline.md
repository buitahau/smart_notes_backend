# Deploying a Node.js Backend with Vertex AI (Gemini) — Authentication Guide

This guide explains how to authenticate a **Node.js backend** that uses the **Vertex AI SDK** when deploying inside **Docker**, with or without Google Cloud.

---

## Why `gcloud auth login` Does Not Work on Servers

`gcloud auth application-default login` is for **local development only**.

Inside production environments (Docker containers, servers, Kubernetes), you must authenticate using:

1. **Service Account Key (JSON file)** — works anywhere  
2. **Workload Identity** — best for Cloud Run / GKE / Cloud Functions  
3. **(Not supported)** API Key — Vertex AI SDK does *not* use API keys

---

# 1. Service Account Key Method (Works Everywhere)

This is the recommended method for:

- Docker on VPS  
- Docker on bare-metal servers  
- Docker in CI/CD pipelines  

---

## Step 1 — Create a Service Account

```bash
gcloud iam service-accounts create vertex-backend-sa
```

---

## Step 2 — Grant Permissions

```bash
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID   --member="serviceAccount:vertex-backend-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com"   --role="roles/aiplatform.user"
```

(Optional for Cloud Storage):

```bash
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID   --member="serviceAccount:vertex-backend-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com"   --role="roles/storage.objectViewer"
```

---

## Step 3 — Create a Service Account Key

```bash
gcloud iam service-accounts keys create key.json   --iam-account=vertex-backend-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

⚠️ Do **not** commit `key.json` to Git.

---

## Step 4 — Add Key to Docker Image or Mount It

### A. Copy into the image

Example structure:

```
project/
 ├─ src/
 ├─ key.json
 └─ Dockerfile
```

Dockerfile:

```dockerfile
ENV GOOGLE_APPLICATION_CREDENTIALS="/app/key.json"
COPY key.json /app/key.json
```

### B. Mount at runtime (more secure)

```bash
docker run -e GOOGLE_APPLICATION_CREDENTIALS=/app/key.json   -v $(pwd)/key.json:/app/key.json   my-backend
```

---

## Step 5 — Node.js Automatically Authenticates

```js
import { VertexAI } from "@google-cloud/vertexai";

const vertex = new VertexAI({
  project: process.env.GCP_PROJECT_ID,
  location: "us-central1"
});
```

---

# 2. Workload Identity (Best for Cloud Run / GKE / Cloud Functions)

In Google Cloud environments, you **do not need key.json**.

Google automatically injects credentials from a service account.

### Example for Cloud Run:

```bash
gcloud run deploy my-api   --image=gcr.io/YOUR_PROJECT/my-api   --service-account=vertex-backend-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

Your Node.js code stays the same:

```js
new VertexAI({
  project: process.env.GCP_PROJECT_ID,
  location: "us-central1"
});
```

---

# 3. Summary

| Deployment environment | Recommended authentication |
|------------------------|----------------------------|
| VPS / bare-metal | Service account key.json |
| Docker on any server | Service account key.json |
| Cloud Run | Workload Identity (no key file) |
| GKE | Workload Identity |
| Cloud Functions | Auto-auth via runtime service account |

---

# 4. Important Notes

- Vertex SDK **does not support API keys**  
- Gemini API keys (AI Studio) ≠ Vertex AI  
- Always secure the key file if used  
- Prefer Workload Identity on GCP  

---

# Need a full Dockerfile + Node.js template?

Ask and I can generate a complete production-ready setup!