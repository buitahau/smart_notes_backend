from fastapi import FastAPI
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
from typing import List
import uvicorn

MODEL_NAME = "sentence-transformers/all-mpnet-base-v2"

app = FastAPI(title="Embedding Service")

# Load model once at startup
model = SentenceTransformer(MODEL_NAME)


class EmbedRequest(BaseModel):
    texts: List[str]


class EmbedResponse(BaseModel):
    embeddings: List[List[float]]
    dimension: int


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/embed", response_model=EmbedResponse)
def embed(req: EmbedRequest):
    embeddings = model.encode(req.texts).tolist()

    return {
        "embeddings": embeddings,
        "dimension": len(embeddings[0]) if embeddings else 0
    }


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)