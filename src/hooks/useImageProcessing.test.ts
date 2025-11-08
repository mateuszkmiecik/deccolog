import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/preact'
import { useImageProcessing } from '@/hooks/useImageProcessing'

// Mock the Image constructor
class MockImage {
  src = ''
  onload: (() => void) | null = null
  onerror: ((error: any) => void) | null = null
  
  constructor() {
    // Simulate async image loading
    setTimeout(() => {
      if (this.onload) {
        this.onload()
      }
    }, 0)
  }
}

// Mock the image processing module
vi.mock('@/lib/image-processing', () => ({
  getRobustFingerprint: vi.fn()
}))

// Mock global Image
Object.defineProperty(globalThis, 'Image', {
  value: MockImage,
  writable: true
})

import { getRobustFingerprint } from '@/lib/image-processing'
const mockGetRobustFingerprint = vi.mocked(getRobustFingerprint)

describe('useImageProcessing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with no image data', () => {
    const { result } = renderHook(() => useImageProcessing())
    
    expect(result.current).toBeDefined()
    expect(result.current.capturedImage).toBe(null)
    expect(result.current.imageFingerprint).toBe(null)
    expect(result.current.fingerprintCanvas).toBe(null)
  })

  it('should process image from string source', async () => {
    const mockFingerprint = [1, 2, 3, 4, 5]
    const mockCanvas = 'data:image/png;base64,canvas'
    const mockResult = {
      fingerprint: mockFingerprint,
      canvas: mockCanvas
    }
    
    mockGetRobustFingerprint.mockResolvedValue(mockResult)
    
    const { result } = renderHook(() => useImageProcessing())
    const imageSource = 'data:image/png;base64,test'
    
    let processResult
    await act(async () => {
      processResult = await result.current.processImage(imageSource)
    })
    
    expect(result.current.capturedImage).toBe(imageSource)
    expect(result.current.imageFingerprint).toBe(mockFingerprint)
    expect(result.current.fingerprintCanvas).toBe(mockCanvas)
    expect(processResult).toEqual(mockResult)
  }, 15000)

  it('should process image from HTMLImageElement', async () => {
    const mockFingerprint = [1, 2, 3, 4, 5]
    const mockCanvas = 'data:image/png;base64,canvas'
    const mockResult = {
      fingerprint: mockFingerprint,
      canvas: mockCanvas
    }
    
    mockGetRobustFingerprint.mockResolvedValue(mockResult)
    
    const { result } = renderHook(() => useImageProcessing())
    const mockImage = { src: 'test' } as HTMLImageElement
    
    let processResult
    await act(async () => {
      processResult = await result.current.processImage(mockImage)
    })
    
    expect(result.current.capturedImage).toBe(null) // Should not be set for HTMLImageElement
    expect(result.current.imageFingerprint).toBe(mockFingerprint)
    expect(result.current.fingerprintCanvas).toBe(mockCanvas)
    expect(processResult).toEqual(mockResult)
  })

  it('should handle image processing error', async () => {
    const mockError = new Error('Processing failed')
    mockGetRobustFingerprint.mockRejectedValue(mockError)
    
    const { result } = renderHook(() => useImageProcessing())
    
    await expect(async () => {
      await act(async () => {
        await result.current.processImage('data:image/png;base64,test')
      })
    }).rejects.toThrow('Failed to process image')
  })

  it('should clear image data', () => {
    const { result } = renderHook(() => useImageProcessing())
    
    // Initially should be null
    expect(result.current.capturedImage).toBe(null)
    expect(result.current.imageFingerprint).toBe(null)
    expect(result.current.fingerprintCanvas).toBe(null)
    
    // Clear should not throw and should maintain null values
    act(() => {
      result.current.clearImage()
    })
    
    expect(result.current.capturedImage).toBe(null)
    expect(result.current.imageFingerprint).toBe(null)
    expect(result.current.fingerprintCanvas).toBe(null)
  })
})