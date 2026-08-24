# ---- Build Stage ----
FROM node:22-slim AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund

COPY . .
RUN npm run build

# ---- Runtime Stage ----
FROM node:22-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN addgroup --system --gid 1001 appgroup && \
    adduser --system --uid 1001 --gid 1001 appuser

COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/package.json /app/package.json

RUN chown -R appuser:appgroup /app

USER appuser

# Streamable HTTP transport
ENV ASHAR_EXCHANGE_TRANSPORT=http
ENV PORT=3001

EXPOSE 3001

HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=5 \
    CMD curl -f http://localhost:3001/health || exit 1

# ASHAR_EXCHANGE_TENANT_KEY is optional at boot (admin endpoints are public);
# set it for convenience so protected calls don't need to pass it per-request.
CMD ["node", "dist/index.js"]
