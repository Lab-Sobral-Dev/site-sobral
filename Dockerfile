# ── Stage 1: build frontend ──────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY index.html ./
COPY vite.config.js tailwind.config.js postcss.config.js ./
COPY src/ ./src/
COPY public/ ./public/

RUN npm run build

# ── Stage 2: production ──────────────────────────────────────
FROM node:20-alpine AS prod
WORKDIR /app

COPY server/package*.json ./server/
RUN cd server && npm ci --omit=dev

COPY server/ ./server/
COPY --from=builder /app/dist ./dist/

RUN mkdir -p public/images/produtos public/images/hero public/images/cms

RUN addgroup -S appgroup && adduser -S appuser -G appgroup \
    && chown -R appuser:appgroup /app
USER appuser

EXPOSE 3001
CMD ["node", "server/src/server.js"]
