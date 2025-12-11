# ============================================
# Multi-Stage Dockerfile for Frontend (Next.js 15)
# ============================================
# Usage:
#   Development: docker build --target development -t frontend-dev .
#   Production:  docker build --target production -t frontend-prod .
# ============================================

# ============================================
# Stage 1: Base Image
# ============================================
FROM node:18-alpine AS base

# Set working directory
WORKDIR /app

# Install dependencies needed for node-gyp and Next.js
RUN apk add --no-cache libc6-compat

# Copy package files
COPY package*.json ./

# ============================================
# Stage 2: Dependencies
# ============================================
FROM base AS dependencies

# Install ALL dependencies (including devDependencies)
RUN npm ci

# ============================================
# Stage 3: Development Stage
# ============================================
FROM dependencies AS development

# Copy all source code
COPY . .

# Expose port
EXPOSE 3000

# Set environment to development
ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1

# Run Next.js in development mode with hot reload
CMD ["npm", "run", "dev"]

# # ============================================
# # Stage 4: Builder Stage
# # ============================================
# FROM dependencies AS builder

# # Copy all source code
# COPY . .

# # Set environment variables for build
# ENV NODE_ENV=production
# ENV NEXT_TELEMETRY_DISABLED=1

# # Build Next.js application
# # Note: If you need environment variables at build time, pass them here
# # RUN npm run build

# ##troubleshoot
# COPY package*.json ./

# # ============================================
# # Stage 5: Production Dependencies
# # ============================================
# FROM base AS prod-dependencies

# # Install ONLY production dependencies
# RUN npm ci --omit=dev

# # # ============================================
# # # Stage 6: Production Stage (Final)
# # # ============================================
# # FROM node:18-alpine AS production

# # # Install dumb-init for proper signal handling
# # RUN apk add --no-cache dumb-init libc6-compat

# # # Create non-root user for security
# # RUN addgroup -g 1001 -S nodejs && \
# # adduser -S nextjs -u 1001

# # # Set working directory
# # WORKDIR /app

# # # Set environment to production
# # ENV NODE_ENV=production
# # ENV NEXT_TELEMETRY_DISABLED=1

# # # Copy production dependencies
# # COPY --from=prod-dependencies /app/node_modules ./node_modules

# # # Copy built Next.js application
# # # Next.js creates these folders after build
# # # COPY --from=builder /app/.next ./.next
# # # COPY --from=builder /app/public ./public
# # # COPY --from=builder /app/package*.json ./



# # # Copy other necessary files
# # COPY --from=builder /app/next.config.ts ./
# # COPY --from=builder /app/middleware.ts ./middleware.ts

# # # Change ownership to non-root user
# # RUN chown -R nextjs:nodejs /app

# # # Switch to non-root user
# # USER nextjs

# # # Expose port
# # EXPOSE 3000

# # # Health check
# # HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
# #     CMD node -e "require('http').get('http://localhost:3000/', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# # # Add labels
# # LABEL maintainer="Rextro Quiz Platform"
# # LABEL description="Frontend for Rextro Department Quiz Platform"

# # # Run Next.js in production mode
# # #trouble shhhpt
# # CMD ["npm", "run", "dev"]