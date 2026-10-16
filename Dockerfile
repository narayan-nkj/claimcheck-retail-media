# syntax=docker/dockerfile:1
# Multi-stage production container for ClaimCheck Retail Media Gate
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json tsconfig.json ./
RUN npm ci

COPY src/ ./src/
COPY scripts/ ./scripts/
COPY tests/ ./tests/

RUN npm run build

# Production runtime image
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Run as unprivileged node user
USER node

COPY --chown=node:node package*.json ./
RUN npm ci --omit=dev

COPY --chown=node:node --from=builder /app/dist ./dist
COPY --chown=node:node src/webapp/public ./src/webapp/public
COPY --chown=node:node src/contracts/v1/schemas ./src/contracts/v1/schemas

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/api/health || exit 1

CMD ["node", "dist/server/index.js"]
