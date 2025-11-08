import { useState, useRef, useCallback, useEffect } from 'preact/hooks'
import type { RefObject } from 'preact'

interface UseCameraReturn {
  readonly isCameraActive: boolean
  readonly stream: MediaStream | null
  readonly videoRef: RefObject<HTMLVideoElement>
  startCamera: () => Promise<void>
  stopCamera: () => void
}

export function useCamera(): UseCameraReturn {
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      })
      setStream(mediaStream)
      setIsCameraActive(true)
      
      // Set video stream immediately if element exists
      if (videoRef.current) {
        console.log('Setting stream immediately:', mediaStream)
        videoRef.current.srcObject = mediaStream
        videoRef.current.play().catch(err => console.error('Video play error:', err))
      }
    } catch (error) {
      console.error('Error accessing camera:', error)
      throw new Error('Unable to access camera. Please check permissions.')
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }
    setIsCameraActive(false)
  }, [stream])

  useEffect(() => {
    if (stream && videoRef.current) {
      console.log('Setting video stream in effect:', stream)
      videoRef.current.srcObject = stream
      videoRef.current.play().catch(err => console.error('Video play error:', err))
    }
  }, [stream])

  return {
    isCameraActive,
    stream,
    videoRef,
    startCamera,
    stopCamera
  }
}