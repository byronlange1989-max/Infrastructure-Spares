# syntax=docker/dockerfile:1
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json tsconfig*.json vite.config.ts ./

# Install all dependencies including devDependencies for build
RUN npm ci

# Copy source code and files
COPY . .

# Build Vite frontend assets to dist/
RUN npm run build

# --- Production Image ---
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Install production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built frontend assets from builder
COPY --from=builder /app/dist ./dist

# Copy server entry and configs
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json

# Copy existing data or create data directory
COPY --from=builder /app/data ./data

# Volume for persistent inventory and transaction data
VOLUME ["/app/data"]

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/parts || exit 1

# Start the full-stack server
CMD ["npx", "tsx", "server.ts"]
