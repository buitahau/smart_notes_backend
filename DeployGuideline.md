When you deploy a Node.js backend in Docker, you should NOT run
gcloud auth application-default login on the server.

Instead, you must authenticate using one of these two correct methods:

✅ (Recommended) 1. Use a Service Account Key (JSON file)

This is the standard way to authenticate a containerized backend.

Step 1 — Create a service account
gcloud iam service-accounts create vertex-backend-sa

Step 2 — Grant permissions

Minimum roles needed for Gemini on Vertex AI:

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:vertex-backend-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/aiplatform.user"


(Optional, if using GCS):

roles/storage.objectViewer

Step 3 — Create JSON key
gcloud iam service-accounts keys create key.json \
  --iam-account=vertex-backend-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com

Step 4 — Put key.json inside your Docker image or mount it

Recommended: use Docker secret or environment variable.

Folder structure

project/
 ├─ src/
 ├─ key.json      <-- (not committed to git!)
 └─ Dockerfile

Step 5 — Set env variable inside Docker

In your Dockerfile:

ENV GOOGLE_APPLICATION_CREDENTIALS="/app/key.json"
COPY key.json /app/key.json


Or using docker run:

docker run -e GOOGLE_APPLICATION_CREDENTIALS=/app/key.json \
  -v $(pwd)/key.json:/app/key.json \
  my-backend

Step 6 — Node.js automatically authenticates

No code changes needed.

import { VertexAI } from "@google-cloud/vertexai";

const vertex = new VertexAI({
  project: process.env.GCP_PROJECT_ID,
  location: "us-central1"
});

✅ (Best for GCP) 2. Use Workload Identity (No Key File)

If you're deploying to:

Cloud Run

Cloud Functions

GKE

Compute Engine

→ You DO NOT need a key file.

Google automatically injects credentials into the container.

Cloud Run Example (Best Practice)
gcloud run deploy my-api \
  --image=gcr.io/YOUR_PROJECT/my-api \
  --service-account=vertex-backend-sa@YOUR_PROJECT_ID.iam.gserviceaccount.com


Inside your Node.js code:

new VertexAI({
  project: process.env.GCP_PROJECT_ID,
  location: "us-central1"
});


👉 No key needed
👉 No gcloud auth needed
👉 Google runtime auto-authenticates the service account

This is the most secure method.

❌ Do NOT use API Keys with Vertex AI

The Vertex SDK does not support API keys.
(Gemini API keys only work for Google AI Studio — not Vertex AI.)