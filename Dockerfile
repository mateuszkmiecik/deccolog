# Stage 1: Build frontend with Bun/Vite
FROM oven/bun:1.3.1-alpine AS frontend-builder

WORKDIR /app

# Copy package files
COPY package.json bun.lock ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Build the frontend
RUN bun run build

# Stage 2: Build Go binary
FROM golang:1.24-alpine AS go-builder

WORKDIR /app

# Copy Go module files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy Go source code
COPY api/ ./api/

# Build static binary
RUN CGO_ENABLED=0 GOOS=linux go build -o server ./api

# Stage 3: Production image
FROM alpine:3.20

WORKDIR /app

# Install ca-certificates for HTTPS requests
RUN apk --no-cache add ca-certificates

# Copy Go binary from builder
COPY --from=go-builder /app/server .

# Copy built frontend from builder
COPY --from=frontend-builder /app/dist ./dist

# Expose port
EXPOSE 3002

# Run the server
CMD ["./server"]
