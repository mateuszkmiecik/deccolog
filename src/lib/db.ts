import { type CollectionItem, type SimilarityResult } from '@/types'
import { DatabaseError } from '@/lib/errors'
import { CloudSyncService } from '@/lib/cloud-sync'

class CollectionDB {
  private db: IDBDatabase | null = null
  private readonly DB_NAME = 'CollectionDB'
  private readonly VERSION = 1
  private readonly STORE_NAME = 'items'
  private syncService = new CloudSyncService()

  async init(): Promise<void> {
    try {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open(this.DB_NAME, this.VERSION)

        request.onerror = () => reject(new DatabaseError(`Failed to open database: ${request.error?.message}`))
        request.onsuccess = () => {
          this.db = request.result
          resolve()
        }

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result
          
          // Create object store for items
          if (!db.objectStoreNames.contains(this.STORE_NAME)) {
            const store = db.createObjectStore(this.STORE_NAME, { keyPath: 'id' })
            store.createIndex('createdAt', 'createdAt', { unique: false })
            store.createIndex('name', 'name', { unique: false })
          }
        }
      })
    } catch (error) {
      throw new DatabaseError(`Database initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async addItem(item: Omit<CollectionItem, 'id' | 'createdAt'>): Promise<string> {
    if (!this.db) throw new DatabaseError('Database not initialized')
    
    try {
      const id = crypto.randomUUID()
      const createdAt = Date.now()
      const fullItem: CollectionItem = { ...item, id, createdAt }

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite')
        const store = transaction.objectStore(this.STORE_NAME)
        const request = store.add(fullItem)

        request.onsuccess = () => resolve(id)
        request.onerror = () => reject(new DatabaseError(`Failed to add item: ${request.error?.message}`))
      })
    } catch (error) {
      throw new DatabaseError(`Add item operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async getItem(id: string): Promise<CollectionItem | null> {
    if (!this.db) throw new DatabaseError('Database not initialized')
    
    try {
      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([this.STORE_NAME], 'readonly')
        const store = transaction.objectStore(this.STORE_NAME)
        const request = store.get(id)

        request.onsuccess = () => resolve(request.result || null)
        request.onerror = () => reject(new DatabaseError(`Failed to get item: ${request.error?.message}`))
      })
    } catch (error) {
      throw new DatabaseError(`Get item operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async getAllItems(): Promise<CollectionItem[]> {
    if (!this.db) throw new DatabaseError('Database not initialized')
    
    try {
      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([this.STORE_NAME], 'readonly')
        const store = transaction.objectStore(this.STORE_NAME)
        const request = store.getAll()

        request.onsuccess = () => resolve(request.result || [])
        request.onerror = () => reject(new DatabaseError(`Failed to get all items: ${request.error?.message}`))
      })
    } catch (error) {
      throw new DatabaseError(`Get all items operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async updateItem(id: string, updates: Partial<CollectionItem>): Promise<void> {
    if (!this.db) throw new DatabaseError('Database not initialized')

    try {
      const existing = await this.getItem(id)
      if (!existing) throw new DatabaseError('Item not found')

      const updated = { ...existing, ...updates }

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite')
        const store = transaction.objectStore(this.STORE_NAME)
        const request = store.put(updated)

        request.onsuccess = () => resolve()
        request.onerror = () => reject(new DatabaseError(`Failed to update item: ${request.error?.message}`))
      })
    } catch (error) {
      throw new DatabaseError(`Update item operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async deleteItem(id: string): Promise<void> {
    if (!this.db) throw new DatabaseError('Database not initialized')
    
    try {
      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite')
        const store = transaction.objectStore(this.STORE_NAME)
        const request = store.delete(id)

        request.onsuccess = () => resolve()
        request.onerror = () => reject(new DatabaseError(`Failed to delete item: ${request.error?.message}`))
      })
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

  async uploadCollection(): Promise<string> {
    const items = await this.getAllItems()
    return this.syncService.uploadCollection(items)
  }

  async downloadAndMergeCollection(syncId: string): Promise<void> {
    const downloadedItems = await this.syncService.downloadCollection(syncId)
    
    for (const item of downloadedItems) {
      const existing = await this.getItem(item.id)
      if (!existing || item.createdAt > existing.createdAt) {
        if (existing) {
          await this.updateItem(item.id, item)
        } else {
          await this.addItem(item)
        }
      }
    }
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