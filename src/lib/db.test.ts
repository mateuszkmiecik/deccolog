import { describe, it, expect } from 'vitest'
import { calculateSimilarity } from '@/lib/db'

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