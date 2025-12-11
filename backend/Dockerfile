# ============================================
# Multi-Stage Dockerfile for Backend (Node.js + TypeScript)
# ============================================
# Usage:
#   Development: docker build --target development -t backend-dev .
#   Production:  docker build --target production -t backend-prod .
# ============================================

# ============================================
# Stage 1: Base Image
# ============================================
FROM node:18-alpine AS base

# Set working directory
WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Copy package files
COPY package*.json ./

# ============================================
# Stage 2: Dependencies
# ============================================
FROM base AS dependencies

# Install ALL dependencies (including devDependencies for build)
RUN npm ci

# ============================================
# Stage 3: Development Stage
# ============================================
# FROM dependencies AS development

# # Copy all source code
# COPY . .

# # Expose port
# EXPOSE 5000

# # Set environment to development
# ENV NODE_ENV=development

# # Run with nodemon for hot reload
# CMD ["dumb-init", "npm", "run", "dev"]

# ============================================
# Stage 4: Build Stage
# ============================================
FROM dependencies AS build

# Copy all source code
COPY . .

# Build TypeScript to JavaScript
RUN npm run build

# ============================================
# Stage 5: Production Dependencies
# ============================================
FROM base AS prod-dependencies

# Install ONLY production dependencies
RUN npm ci --omit=dev

# ============================================
# Stage 6: Production Stage (Final)
# ============================================
FROM node:18-alpine AS production

# Install dumb-init
RUN apk add --no-cache dumb-init

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy production dependencies
COPY --from=prod-dependencies --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy built application
COPY --from=build --chown=nodejs:nodejs /app/dist ./dist
COPY --from=build --chown=nodejs:nodejs /app/package*.json ./

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 5000

# Set environment to production
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5000/', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Add labels
LABEL maintainer="Rextro Quiz Platform"
LABEL version="1.0"
LABEL description="Backend API for Rextro Department Quiz Platform"

# Run application
CMD ["dumb-init", "node", "dist/index.js"]
