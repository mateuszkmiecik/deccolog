# 🐳 Full-Stack Docker Deployment Guide

## Files Created
- `Dockerfile` - Multi-stage build with frontend + backend
- `docker-compose.yml` - Production-ready full-stack service
- `.dockerignore` - Optimizes build context
- `DOCKER.md` - Complete deployment documentation

## What's Included
- ✅ **Frontend** - Built Preact app served statically
- ✅ **Backend** - Sync API with Hono/Bun
- ✅ **Single Container** - Both services in one
- ✅ **Production Ready** - Optimized for deployment

## Quick Commands

### 1. Build & Run (Recommended)
```bash
bun run docker:compose
```

### 2. Manual Steps
```bash
# Build image
bun run docker:build

# Run container
bun run docker:run
```

### 3. Production Deployment
```bash
# Deploy to production
docker-compose -f docker-compose.yml up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

## Access Points
- **Frontend**: `http://localhost:3002/`
- **API**: `http://localhost:3002/api/sync/*`
- **Health**: `http://localhost:3002/api/sync/download/health`

## Service Features
- ✅ **Full-stack** - Frontend + API in one container
- ✅ **Health checks** with automatic restart
- ✅ **Port 3002** serves both web app and API
- ✅ **Production optimized** (Alpine Linux)
- ✅ **Auto-cleanup** of expired sync sessions
- ✅ **SPA routing** support
- ✅ **Static asset serving** with proper MIME types

## Environment Variables
```bash
NODE_ENV=production
PORT=3002
```

## API Endpoints
- `POST /api/sync/upload` - Upload collection
- `GET /api/sync/download/:id` - Download collection  
- `GET /api/sync/download/health` - Health check
- `GET /*` - Frontend static files

## Deployment Options

### Local Development
```bash
docker-compose up
```

### Production Server
```bash
docker-compose -f docker-compose.yml up -d
```

### Cloud Deployment
The Docker image can be deployed to:
- AWS ECS/Fargate
- Google Cloud Run
- Azure Container Instances
- DigitalOcean App Platform

## Next Steps
1. Start Docker daemon on your machine
2. Run `bun run docker:compose`
3. Visit `http://localhost:3002` to access the app
4. Test sync functionality across devices

## Architecture
```
┌─────────────────┐
│   Docker Container   │
│  ┌─────────────┐  │
│  │   Frontend  │  │  ← Built Preact app
│  │   (dist/)   │  │
│  └─────────────┘  │
│  ┌─────────────┐  │
│  │   Backend   │  │  ← Hono/Bun API
│  │  (server.ts)│  │
│  └─────────────┘  │
│       Port 3002     │
└─────────────────┘
```