# Embedding Service

Sentence Transformer embedding microservice using:

Model: all-mpnet-base-v2  
Dimension: 768  

---

## Build

docker build -t buitahau/embedding-service:1.0.0 .

---

## Run

docker run -p 8000:8000 embedding-service:1.0.0

---

## API

### Health Check
GET /health

---

### Generate Embeddings
POST /embed

Request:
{
  "texts": ["hello world", "another sentence"]
}

Response:
{
  "embeddings": [[...],[...]],
  "dimension": 768
}
