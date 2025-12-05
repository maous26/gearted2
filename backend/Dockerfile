# Multi-stage build for smaller final image
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY backend/package*.json ./
COPY backend/tsconfig.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY backend/ .

# Generate Prisma client and build TypeScript
RUN npx prisma generate
RUN npm run build

# Production stage
FROM node:22-alpine

WORKDIR /app

# Install bash for start.sh script
RUN apk add --no-cache bash

# Copy package files
COPY backend/package*.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma

# Copy start script
COPY backend/start.sh ./

# Make start script executable
RUN chmod +x start.sh

# Expose port (Railway will use PORT env variable)
EXPOSE 3000

# Use start.sh script
CMD ["bash", "start.sh"]
