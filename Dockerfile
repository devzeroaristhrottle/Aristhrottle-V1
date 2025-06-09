# syntax=docker.io/docker/dockerfile:1

# Base image using Node.js 18 Alpine for minimal size
FROM node:18-alpine AS base

# Install dependencies stage
FROM base AS deps
# Add libc6-compat for native modules (required for some React Native dependencies)
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package manager files
COPY package.json package-lock.json* .npmrc* ./
# Install dependencies with npm, using --legacy-peer-deps to resolve conflicts
RUN \
  if [ -f package-lock.json ]; then npm ci --legacy-peer-deps; \
  else echo "package-lock.json not found." && exit 1; \
  fi

# Build stage
FROM base AS builder
WORKDIR /app
# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules
# Copy all project files
COPY . .

# Disable Next.js telemetry (optional, uncomment to enable)
# ENV NEXT_TELEMETRY_DISABLED=1

# Build the Next.js app
RUN npm run build

# Production runner stage
FROM base AS runner
WORKDIR /app

# Set production environment
ENV NODE_ENV=production
# Disable telemetry in production (optional, uncomment to enable)
# ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy public assets and Next.js build output
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Switch to non-root user
USER nextjs

# Expose port 3000
EXPOSE 3000

# Set environment variables for Next.js
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Run the Next.js standalone server
CMD ["node", "server.js"]