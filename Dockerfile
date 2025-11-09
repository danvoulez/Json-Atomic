# Multi-stage Dockerfile for JsonAtomic
# Hardened with non-root user, read-only filesystem, and minimal attack surface

# Stage 1: Build
FROM node:20.10.0-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Stage 2: Runtime (Hardened)
FROM node:20.10.0-alpine AS runtime

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init=1.2.5-r2

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S jsonatomic && \
    adduser -u 1001 -S jsonatomic -G jsonatomic

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy built files from builder
COPY --from=builder --chown=jsonatomic:jsonatomic /app/dist ./dist
COPY --from=builder --chown=jsonatomic:jsonatomic /app/schemas ./schemas

# Create data directory with proper permissions
RUN mkdir -p /app/data && \
    chown -R jsonatomic:jsonatomic /app && \
    chmod -R 550 /app && \
    chmod -R 770 /app/data

# Switch to non-root user
USER jsonatomic

# Expose ports
EXPOSE 8000 9090

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:8000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Set environment variables
ENV NODE_ENV=production \
    PORT=8000 \
    HOST=0.0.0.0 \
    LEDGER_PATH=/app/data/ledger.jsonl \
    NODE_OPTIONS="--max-old-space-size=512"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/index.js"]

# Security labels
LABEL maintainer="LogLineOS Team" \
      version="1.1.0" \
      description="JsonAtomic Core - Hardened Production Container" \
      org.opencontainers.image.source="https://github.com/danvoulez/JsonAtomic" \
      org.opencontainers.image.vendor="LogLineOS" \
      org.opencontainers.image.licenses="MIT"
