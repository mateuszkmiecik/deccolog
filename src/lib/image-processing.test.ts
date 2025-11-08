import { describe, it, expect, beforeEach, vi } from 'vitest'
import { rgbToHsv, getRobustFingerprint } from '@/lib/image-processing'

// Mock canvas and context
const mockCanvas = {
  width: 0,
  height: 0,
  getContext: vi.fn(),
  toDataURL: vi.fn(() => 'data:image/png;base64,mock')
}

const mockContext = {
  filter: '',
  drawImage: vi.fn(),
  getImageData: vi.fn(() => ({
    data: new Uint8ClampedArray([
      255, 0, 0, 255,    // Red
      0, 255, 0, 255,    // Green  
      0, 0, 255, 255,    // Blue
      255, 255, 255, 255 // White
    ])
  }))
}

// Mock document.createElement
Object.defineProperty(globalThis, 'document', {
  value: {
    createElement: vi.fn(() => mockCanvas)
  },
  writable: true
})

describe('rgbToHsv', () => {
  it('should convert pure red to HSV correctly', () => {
    const [h, s] = rgbToHsv(255, 0, 0)
    expect(h).toBeCloseTo(0, 1)
    expect(s).toBeCloseTo(1, 1)
  })

  it('should convert pure green to HSV correctly', () => {
    const [h, s] = rgbToHsv(0, 255, 0)
    expect(h).toBeCloseTo(120, 1)
    expect(s).toBeCloseTo(1, 1)
  })

  it('should convert pure blue to HSV correctly', () => {
    const [h, s] = rgbToHsv(0, 0, 255)
    expect(h).toBeCloseTo(240, 1)
    expect(s).toBeCloseTo(1, 1)
  })

  it('should convert white to HSV correctly', () => {
    const [h, s] = rgbToHsv(255, 255, 255)
    expect(h).toBe(0)
    expect(s).toBe(0)
  })

  it('should convert black to HSV correctly', () => {
    const [h, s] = rgbToHsv(0, 0, 0)
    expect(h).toBe(0)
    expect(s).toBe(0)
  })

  it('should convert gray to HSV correctly', () => {
    const [h, s] = rgbToHsv(128, 128, 128)
    expect(h).toBe(0)
    expect(s).toBe(0)
  })
})

describe('getRobustFingerprint', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCanvas.getContext.mockReturnValue(mockContext)
  })

  it('should generate fingerprint from image', async () => {
    const mockImage = new Image() as any
    Object.defineProperty(mockImage, 'complete', { value: true })
    Object.defineProperty(mockImage, 'naturalWidth', { value: 100 })
    Object.defineProperty(mockImage, 'naturalHeight', { value: 100 })

    const result = await getRobustFingerprint(mockImage, 8)
    
    expect(result.fingerprint).toBeDefined()
    expect(result.fingerprint).toHaveLength(8) // Mock data has 4 pixels * 2 values per pixel (h, s)
    expect(result.canvas).toBe('data:image/png;base64,mock')
  })

  it('should handle missing context gracefully', async () => {
    mockCanvas.getContext.mockReturnValue(null)
    
    const mockImage = new Image() as any
    Object.defineProperty(mockImage, 'complete', { value: true })
    Object.defineProperty(mockImage, 'naturalWidth', { value: 100 })
    Object.defineProperty(mockImage, 'naturalHeight', { value: 100 })
    
    await expect(getRobustFingerprint(mockImage)).rejects.toThrow('Cannot get canvas context')
  })

  it('should use default size when not specified', async () => {
    const mockImage = new Image() as any
    Object.defineProperty(mockImage, 'complete', { value: true })
    Object.defineProperty(mockImage, 'naturalWidth', { value: 100 })
    Object.defineProperty(mockImage, 'naturalHeight', { value: 100 })
    
    await getRobustFingerprint(mockImage)
    
    expect(mockCanvas.width).toBe(32)
    expect(mockCanvas.height).toBe(32)
  })

  it('should apply blur filter', async () => {
    const mockImage = new Image() as any
    Object.defineProperty(mockImage, 'complete', { value: true })
    Object.defineProperty(mockImage, 'naturalWidth', { value: 100 })
    Object.defineProperty(mockImage, 'naturalHeight', { value: 100 })
    
    await getRobustFingerprint(mockImage)
    
    expect(mockContext.filter).toBe('blur(1px)')
    expect(mockContext.drawImage).toHaveBeenCalled()
  })
})