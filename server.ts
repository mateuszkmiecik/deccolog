import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { readFile } from 'fs/promises'
import { extname } from 'path'

const app = new Hono()

// In-memory storage (reset on server restart)
const syncStore = new Map()

// Serve static frontend files
app.get('/*', async (c) => {
  const path = c.req.path === '/' ? '/index.html' : c.req.path
  const filePath = `./dist${path}`
  
  try {
    const file = await readFile(filePath)
    const ext = extname(path)
    
    const contentType = {
      '.html': 'text/html',
      '.js': 'application/javascript',
      '.css': 'text/css',
      '.svg': 'image/svg+xml',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.ico': 'image/x-icon'
    }[ext] || 'text/plain'
    
    return new Response(file, {
      headers: { 'Content-Type': contentType }
    })
  } catch {
    // Fallback to index.html for SPA routing
    try {
      const indexFile = await readFile('./dist/index.html')
      return new Response(indexFile, {
        headers: { 'Content-Type': 'text/html' }
      })
    } catch {
      return c.text('Not Found', 404)
    }
  }
})

// CORS middleware for API routes
app.use('/api/*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}))

// Upload collection
app.post('/api/sync/upload', async (c) => {
  try {
    const { data } = await c.req.json()
    const syncId = Math.random().toString(36).substring(2, 18)
    const createdAt = Date.now()
    const expiresAt = createdAt + 24 * 60 * 60 * 1000 // 24 hours

    syncStore.set(syncId, {
      data,
      createdAt,
      expiresAt
    })

    // Cleanup expired sessions
    cleanupExpiredSessions()

    return c.json({ success: true, syncId })
  } catch (error) {
    return c.json({ success: false, error: 'Upload failed' }, 500)
  }
})

// Download collection
app.get('/api/sync/download/:syncId', (c) => {
  try {
    const syncId = c.req.param('syncId')
    const session = syncStore.get(syncId)

    if (!session) {
      return c.json({ success: false, error: 'Session not found' }, 404)
    }

    if (Date.now() > session.expiresAt) {
      syncStore.delete(syncId)
      return c.json({ success: false, error: 'Session expired' }, 410)
    }

    return c.json({ success: true, data: session.data })
  } catch (error) {
    return c.json({ success: false, error: 'Download failed' }, 500)
  }
})

// Cleanup expired sessions
function cleanupExpiredSessions() {
  const now = Date.now()
  for (const [key, session] of syncStore.entries()) {
    if (now > session.expiresAt) {
      syncStore.delete(key)
    }
  }
}

// Health check endpoint
app.get('/api/sync/download/health', (c) => {
  return c.json({ success: true, status: 'healthy', timestamp: Date.now() })
})

// Auto-cleanup every hour
setInterval(cleanupExpiredSessions, 60 * 60 * 1000)

const port = 3002
console.log(`Sync server running on http://localhost:${port}`)

serve({
  fetch: app.fetch,
  port
})