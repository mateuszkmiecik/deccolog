import { type CollectionItem } from '@/types'
import { SyncError } from '@/lib/errors'

interface SyncSession {
  id: string
  data: CollectionItem[]
  createdAt: number
  expiresAt: number
}

class CloudSyncService {
  private readonly API_BASE = import.meta.env.PROD 
    ? ''  // Use relative URL in production (same origin)
    : 'http://localhost:3002'  // Use localhost in development

  async uploadCollection(items: CollectionItem[]): Promise<string> {
    try {
      const response = await fetch(`${this.API_BASE}/api/sync/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: items }),
      })

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`)
      }

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Upload failed')
      }

      return result.syncId
    } catch (error) {
      throw new SyncError(`Failed to upload collection: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async downloadCollection(syncId: string): Promise<CollectionItem[]> {
    try {
      const response = await fetch(`${this.API_BASE}/api/sync/download/${syncId}`)

      if (!response.ok) {
        if (response.status === 404) {
          throw new SyncError('Sync session not found')
        }
        if (response.status === 410) {
          throw new SyncError('Sync session expired')
        }
        throw new Error(`Download failed: ${response.statusText}`)
      }

      const result = await response.json()
      if (!result.success) {
        throw new SyncError(result.error || 'Download failed')
      }

      return result.data
    } catch (error) {
      if (error instanceof SyncError) throw error
      throw new SyncError(`Failed to download collection: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  generateSyncUrl(syncId: string): string {
    return `deccolog://sync/${syncId}`
  }

  parseSyncUrl(url: string): string | null {
    const match = url.match(/deccolog:\/\/sync\/([a-f0-9]+)/)
    return match ? match[1] : null
  }
}

export { CloudSyncService, type SyncSession }