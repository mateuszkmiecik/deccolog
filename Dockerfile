# Use the official Bun image
FROM oven/bun:1.3.1-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json bun.lock ./

# Install all dependencies (including devDependencies for build)
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Build the frontend
RUN bun run build

# Install only production dependencies
RUN bun install --frozen-lockfile --production

# Expose ports
EXPOSE 3002

# Set environment to production
ENV NODE_ENV=production

# Run the sync service (which also serves frontend)
CMD ["bun", "run", "server.ts"]