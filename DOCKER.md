# Docker Deployment

## Quick Start

### Option 1: Using Docker Compose (Recommended)
```bash
# Build and run the sync service
bun run docker:compose

# Stop the service
bun run docker:stop
```

### Option 2: Using Docker directly
```bash
# Build the image
bun run docker:build

# Run the container
bun run docker:run
```

### Option 3: Manual Docker commands
```bash
# Build
docker build -t deccolog-sync .

# Run
docker run -d -p 3002:3002 --name deccolog-sync deccolog-sync

# Check logs
docker logs deccolog-sync

# Stop
docker stop deccolog-sync
```

## Configuration

### Environment Variables
- `NODE_ENV`: Set to `production` (default)
- `PORT`: Server port (default: 3002)

### Health Check
The service includes a health check endpoint:
```
GET http://localhost:3002/api/sync/download/health
```

## Production Deployment

### With persistent storage (optional)
If you want persistent data across container restarts, uncomment the volume in `docker-compose.yml`:
```yaml
volumes:
  - ./data:/app/data
```

### Behind reverse proxy
When using nginx or other reverse proxy, make sure to:
1. Forward port 3002 to your desired external port
2. Handle CORS headers if needed
3. Set up SSL termination

## API Endpoints

- `POST /api/sync/upload` - Upload collection data
- `GET /api/sync/download/:syncId` - Download collection data
- `GET /api/sync/download/health` - Health check

## Monitoring

### Check container status
```bash
docker ps
docker-compose ps
```

### View logs
```bash
docker logs deccolog-sync
docker-compose logs -f
```

### Resource usage
```bash
docker stats deccolog-sync
```