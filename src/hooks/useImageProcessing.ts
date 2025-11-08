import { useState, useCallback } from 'preact/hooks'
import { getRobustFingerprint } from '@/lib/image-processing'
import { type FingerprintResult } from '@/types'

export function useImageProcessing() {
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [imageFingerprint, setImageFingerprint] = useState<number[] | null>(null)
  const [fingerprintCanvas, setFingerprintCanvas] = useState<string | null>(null)

  const processImage = useCallback(async (imageSource: string | HTMLImageElement) => {
    try {
      let img: HTMLImageElement
      
      if (typeof imageSource === 'string') {
        img = new Image()
        await new Promise((resolve, reject) => {
          img.onload = resolve
          img.onerror = reject
          img.src = imageSource
        })
      } else {
        img = imageSource
      }

      const result: FingerprintResult = await getRobustFingerprint(img)
      
      if (typeof imageSource === 'string') {
        setCapturedImage(imageSource)
      }
      
      setImageFingerprint(result.fingerprint)
      setFingerprintCanvas(result.canvas)
      
      return result
    } catch (error) {
      console.error('Error processing image:', error)
      throw new Error('Failed to process image')
    }
  }, [])

  const clearImage = useCallback(() => {
    setCapturedImage(null)
    setImageFingerprint(null)
    setFingerprintCanvas(null)
  }, [])

  return {
    capturedImage,
    imageFingerprint,
    fingerprintCanvas,
    processImage,
    clearImage
  }
}