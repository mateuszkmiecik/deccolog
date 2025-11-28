import { describe, it, expect } from 'vitest'
import { calculateSimilarity, CollectionDB, type CollectionItem } from '@/lib/db'

describe('calculateSimilarity', () => {
  it('should calculate similarity metrics correctly', () => {
    const fp1 = [1, 2, 3, 4, 5]
    const fp2 = [1, 2, 3, 4, 5]
    const result = calculateSimilarity(fp1, fp2)
    
    expect(result.euclidean).toBe(0)
    expect(result.cosine).toBe(1)
    expect(result.manhattan).toBe(0)
    expect(result.isSimilar).toBe(true)
  })

  it('should identify different fingerprints as not similar', () => {
    const fp1 = [1, 2, 3, 4, 5]
    const fp2 = [10, 20, 30, 40, 50]
    const result = calculateSimilarity(fp1, fp2)
    
    expect(result.euclidean).toBeGreaterThan(0.5)
    expect(result.cosine).toBeLessThanOrEqual(1)
    expect(result.manhattan).toBeGreaterThan(0)
    expect(result.isSimilar).toBe(false)
  })

  it('should handle different length fingerprints', () => {
    const fp1 = [1, 2, 3]
    const fp2 = [1, 2, 3, 4, 5]
    
    expect(() => calculateSimilarity(fp1, fp2)).not.toThrow()
  })

  it('should calculate euclidean distance correctly', () => {
    const fp1 = [0, 0]
    const fp2 = [3, 4]
    const result = calculateSimilarity(fp1, fp2)
    
    expect(result.euclidean).toBe(5) // 3-4-5 triangle
  })

  it('should handle zero vectors', () => {
    const fp1 = [0, 0, 0]
    const fp2 = [0, 0, 0]
    const result = calculateSimilarity(fp1, fp2)
    
    expect(result.euclidean).toBe(0)
    expect(result.manhattan).toBe(0)
  })
})

describe('CollectionDB (REST client)', () => {
  let db: CollectionDB
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    db = new CollectionDB()
    // ensure deterministic base url for tests
    return db.init('/api/items')
  })

  afterEach(() => {
    // restore fetch
    // @ts-ignore
    globalThis.fetch = originalFetch
  })

  it('addItem posts generated item and returns server-provided id', async () => {
    // prepare an existing latest item so indexNumber increments
    const existing: CollectionItem = {
      id: 'existing-id',
      name: 'Existing',
      description: 'existing',
      image256: 'data:image',
      fingerprint: [0, 0, 0],
      createdAt: Date.now() - 1000,
      indexNumber: 3,
    }

    // stub fetch to handle /latest and POST
    // @ts-ignore
    globalThis.fetch = vi.fn(async (url, opts) => {
      if (typeof url === 'string' && url.endsWith('/latest')) {
        return {
          ok: true,
          json: async () => existing,
        }
      }

      if (typeof url === 'string' && url.endsWith('/api/items')) {
        // POST
        return {
          ok: true,
          json: async () => ({ id: 'server-id' })
        }
      }

      return { ok: false, status: 500, statusText: 'unexpected' }
    })

    const id = await db.addItem({
      name: 'New',
      description: 'desc',
      image256: 'data:image/jpg',
      fingerprint: [1, 2, 3],
    })

    expect(id).toBe('server-id')
  })

  it('getItem returns item for existing id and null for 404', async () => {
    const existing: CollectionItem = {
      id: 'abc', name: 'N', description: '', image256: '', fingerprint: [1], createdAt: Date.now()
    }

    // first call returns existing
    // @ts-ignore
    globalThis.fetch = vi.fn(async (url) => {
      if (typeof url === 'string' && url.endsWith('/abc')) {
        return { ok: true, json: async () => existing }
      }
      if (typeof url === 'string' && url.endsWith('/404')) {
        return { ok: false, status: 404, statusText: 'Not Found' }
      }
      return { ok: false, status: 500 }
    })

    const a = await db.getItem('abc')
    expect(a).toEqual(existing)

    const b = await db.getItem('404')
    expect(b).toBeNull()
  })

  it('getAllItems returns array', async () => {
    const items: CollectionItem[] = [{ id: '1', name: 'n', description: '', image256: '', fingerprint: [0], createdAt: 1 }]
    // @ts-ignore
    globalThis.fetch = vi.fn(async (url) => ({ ok: true, json: async () => items }))

    const all = await db.getAllItems()
    expect(all).toEqual(items)
  })

  it('updateItem fetches existing and PUTs updated payload', async () => {
    const existing: CollectionItem = { id: 'u1', name: 'n', description: '', image256: '', fingerprint: [1], createdAt: 1 }

    // fetch sequence: GET /u1 then PUT /u1
    // @ts-ignore
    const fetchMock = vi.fn(async (url, opts) => {
      if (typeof url === 'string' && url.endsWith('/u1') && (!opts || opts.method === 'GET')) {
        return { ok: true, json: async () => existing }
      }

      if (typeof url === 'string' && url.endsWith('/u1') && opts && (opts as any).method === 'PUT') {
        return { ok: true }
      }

      return { ok: false }
    })
    // @ts-ignore
    globalThis.fetch = fetchMock

    await db.updateItem('u1', { name: 'updated' })

    // make sure PUT was called
    const putCalls = fetchMock.mock.calls.filter((c: any[]) => (c[1] && c[1].method === 'PUT'))
    expect(putCalls.length).toBe(1)
    const body = JSON.parse(putCalls[0][1].body)
    expect(body.name).toBe('updated')
  })

  it('deleteItem calls DELETE', async () => {
    // @ts-ignore
    globalThis.fetch = vi.fn(async (url, opts) => ({ ok: true }))

    await expect(db.deleteItem('gone')).resolves.toBeUndefined()
  })

  it('findSimilarItems filters and sorts', async () => {
    const items: CollectionItem[] = [
      { id: 'a', name: 'a', description: '', image256: '', fingerprint: [0, 0], createdAt: 1 },
      { id: 'b', name: 'b', description: '', image256: '', fingerprint: [3, 4], createdAt: 2 },
    ]

    // @ts-ignore
    globalThis.fetch = vi.fn(async (url) => ({ ok: true, json: async () => items }))

    const got = await db.findSimilarItems([0, 0], 6)
    // expect both items are returned (distance 0 and 5) since threshold 6
    expect(got.length).toBe(2)

    const got2 = await db.findSimilarItems([0, 0], 1)
    // only item 'a' should be similar (distance 0)
    expect(got2.length).toBe(1)
    expect(got2[0].id).toBe('a')
  })
})