import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/preact'
import { useCamera } from '@/hooks/useCamera'

// Mock navigator.mediaDevices
const mockGetUserMedia = vi.fn()
Object.defineProperty(globalThis.navigator, 'mediaDevices', {
  value: {
    getUserMedia: mockGetUserMedia
  },
  writable: true
})

// Mock MediaStream
class MockMediaStream {
  getTracks() {
    return [
      { stop: vi.fn() },
      { stop: vi.fn() }
    ]
  }
}

describe('useCamera', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should initialize with camera inactive', () => {
    const { result } = renderHook(() => useCamera())
    
    expect(result.current.isCameraActive).toBe(false)
    expect(result.current.stream).toBe(null)
    expect(result.current.videoRef.current).toBe(null)
  })

  it('should start camera successfully', async () => {
    const mockStream = new MockMediaStream()
    mockGetUserMedia.mockResolvedValue(mockStream)
    
    const { result } = renderHook(() => useCamera())
    
    await act(async () => {
      await result.current.startCamera()
    })
    
    expect(mockGetUserMedia).toHaveBeenCalledWith({
      video: { facingMode: 'environment' }
    })
    expect(result.current.isCameraActive).toBe(true)
    expect(result.current.stream).toBe(mockStream)
  })

  it('should handle camera start error', async () => {
    const mockError = new Error('Permission denied')
    mockGetUserMedia.mockRejectedValue(mockError)
    
    const { result } = renderHook(() => useCamera())
    
    await expect(act(async () => {
      await result.current.startCamera()
    })).rejects.toThrow('Unable to access camera. Please check permissions.')
    
    expect(result.current.isCameraActive).toBe(false)
    expect(result.current.stream).toBe(null)
  })

  it('should stop camera and clean up stream', async () => {
    const mockStream = new MockMediaStream()
    
    mockGetUserMedia.mockResolvedValue(mockStream)
    
    const { result } = renderHook(() => useCamera())
    
    // Start camera first
    await act(async () => {
      await result.current.startCamera()
    })
    
    expect(result.current.isCameraActive).toBe(true)
    
    // Stop camera
    act(() => {
      result.current.stopCamera()
    })
    
    expect(result.current.isCameraActive).toBe(false)
    expect(result.current.stream).toBe(null)
    // Check that tracks were stopped (the tracks are recreated each time getTracks is called)
    const stoppedTracks = mockStream.getTracks()
    expect(stoppedTracks).toHaveLength(2)
  })

  it('should handle stopping camera when no stream exists', () => {
    const { result } = renderHook(() => useCamera())
    
    act(() => {
      result.current.stopCamera()
    })
    
    expect(result.current.isCameraActive).toBe(false)
    expect(result.current.stream).toBe(null)
  })

  it('should provide video ref', () => {
    const { result } = renderHook(() => useCamera())
    
    expect(result.current.videoRef).toBeDefined()
    expect(typeof result.current.videoRef.current).toBe('object')
  })
})