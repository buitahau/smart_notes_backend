# syntax=docker/dockerfile:1
FROM node:20-alpine AS base

WORKDIR /app

# Install dependencies based on lockfile for reproducible builds
COPY package*.json ./
RUN npm ci --omit=dev

# Copy application source
COPY src ./src
COPY drizzle.config.js ./drizzle.config.js

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["node", "src/index.js"]
