import { type CollectionItem, type SimilarityResult } from '@/types'
import { DatabaseError } from '@/lib/errors'
import { nanoid } from 'nanoid'

class CollectionDB {
  // base API url for managing collection items — can be overridden via init
  private baseUrl = '/api/items'

  /**
   * Initialize the client. Optionally pass the base URL for the REST endpoints.
   */
  async init(baseUrl?: string): Promise<void> {
    if (baseUrl) this.baseUrl = baseUrl

    // Optionally we could probe the server here; keep lightweight to avoid
    // making network assumptions in tests. No-op if baseUrl is left default.
    return Promise.resolve()
  }

  async addItem(item: Omit<CollectionItem, 'id' | 'createdAt'>): Promise<string> {
    try {
      const id = nanoid()
      const createdAt = Date.now()
      const latestItem = await this.getLatestAddedItem()
      const indexNumber = latestItem ? (latestItem.indexNumber || 0) + 1 : 1
      const fullItem: CollectionItem = { ...item, id, createdAt, indexNumber }

      const res = await fetch(this.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullItem),
      })

      if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new DatabaseError(`Failed to add item: ${res.status} ${res.statusText} ${text}`)
      }

      // If the server returns the created item use it; otherwise assume success
      try {
        const data = await res.json().catch(() => null)
        // If server returns created item including id, prefer that id
        if (data && typeof data.id === 'string') return data.id
      } catch {}

      return id
    } catch (error) {
      throw new DatabaseError(`Add item operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async getItem(id: string): Promise<CollectionItem | null> {
    try {
      const res = await fetch(`${this.baseUrl}/${encodeURIComponent(id)}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      })

      if (res.status === 404) return null
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new DatabaseError(`Failed to get item: ${res.status} ${res.statusText} ${text}`)
      }

      const item = await res.json()
      return item as CollectionItem
    } catch (error) {
      throw new DatabaseError(`Get item operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async getAllItems(): Promise<CollectionItem[]> {
    try {
      const res = await fetch(this.baseUrl, { method: 'GET', headers: { 'Accept': 'application/json' } })

      if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new DatabaseError(`Failed to get all items: ${res.status} ${res.statusText} ${text}`)
      }

      const data = await res.json()
      return Array.isArray(data) ? (data as CollectionItem[]) : []
    } catch (error) {
      throw new DatabaseError(`Get all items operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async getLatestAddedItem(): Promise<CollectionItem | null> {
    try {
      // Server might expose a dedicated endpoint, but fall back to client-side scan
      // for compatibility with servers that don't implement /latest.
      try {
        const res = await fetch(`${this.baseUrl}/latest`, { method: 'GET', headers: { 'Accept': 'application/json' } })
        if (res.ok) {
          const item = await res.json()
          return item || null
        }
      } catch (e) {
        // ignore and fall back
      }

      const all = await this.getAllItems()
      if (!all || all.length === 0) return null
      return all.reduce((latest, cur) => (cur.createdAt > latest.createdAt ? cur : latest), all[0])
    } catch (error) {
      throw new DatabaseError(`Get latest item operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async updateItem(id: string, updates: Partial<CollectionItem>): Promise<void> {
    try {
      // Ensure the item exists locally first
      const existing = await this.getItem(id)
      if (!existing) throw new DatabaseError('Item not found')

      const payload = { ...existing, ...updates }
      const res = await fetch(`${this.baseUrl}/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new DatabaseError(`Failed to update item: ${res.status} ${res.statusText} ${text}`)
      }
    } catch (error) {
      throw new DatabaseError(`Update item operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async deleteItem(id: string): Promise<void> {
    try {
      const res = await fetch(`${this.baseUrl}/${encodeURIComponent(id)}`, { method: 'DELETE' })
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new DatabaseError(`Failed to delete item: ${res.status} ${res.statusText} ${text}`)
      }
    } catch (error) {
      throw new DatabaseError(`Delete item operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async findSimilarItems(fingerprint: ReadonlyArray<number>, threshold = 0.5): Promise<CollectionItem[]> {
    const allItems = await this.getAllItems()
    
    return allItems.filter(item => {
      const similarity = calculateSimilarity(fingerprint, item.fingerprint)
      return similarity.euclidean < threshold
    }).sort((a, b) => {
      const simA = calculateSimilarity(fingerprint, a.fingerprint)
      const simB = calculateSimilarity(fingerprint, b.fingerprint)
      return simA.euclidean - simB.euclidean
    })
  }

}

// Similarity functions (moved from app.tsx)
function euclideanDistance(fp1: ReadonlyArray<number>, fp2: ReadonlyArray<number>): number {
  return Math.sqrt(
    fp1.reduce((sum, val, i) => sum + Math.pow(val - fp2[i], 2), 0)
  )
}

function cosineSimilarity(fp1: ReadonlyArray<number>, fp2: ReadonlyArray<number>): number {
  const dotProduct = fp1.reduce((sum, val, i) => sum + val * fp2[i], 0)
  const magnitude1 = Math.sqrt(fp1.reduce((sum, val) => sum + val * val, 0))
  const magnitude2 = Math.sqrt(fp2.reduce((sum, val) => sum + val * val, 0))
  return dotProduct / (magnitude1 * magnitude2)
}

function manhattanDistance(fp1: ReadonlyArray<number>, fp2: ReadonlyArray<number>): number {
  return fp1.reduce((sum, val, i) => sum + Math.abs(val - fp2[i]), 0)
}

function calculateSimilarity(fp1: ReadonlyArray<number>, fp2: ReadonlyArray<number>): SimilarityResult {
  const euclidean = euclideanDistance(fp1, fp2)
  const cosine = cosineSimilarity(fp1, fp2)
  const manhattan = manhattanDistance(fp1, fp2)
  
  const isSimilar = euclidean < 0.5
  
  return { euclidean, cosine, manhattan, isSimilar }
}

export { CollectionDB, type CollectionItem, calculateSimilarity }