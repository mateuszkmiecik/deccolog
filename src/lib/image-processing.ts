export function rgbToHsv(r: number, g: number, b: number): [number, number] {
  r /= 255
  g /= 255
  b /= 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const diff = max - min

  let h = 0
  let s = max === 0 ? 0 : diff / max

  if (diff !== 0) {
    switch (max) {
      case r:
        h = ((g - b) / diff + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / diff + 2) / 6
        break
      case b:
        h = ((r - g) / diff + 4) / 6
        break
    }
  }

  return [h * 360, s]
}

import { type FingerprintResult } from '@/types'
import { ImageProcessingError } from '@/lib/errors'

export async function getRobustFingerprint(
  img: HTMLImageElement, 
  size = 32
): Promise<FingerprintResult> {
  if (!img.complete || img.naturalWidth === 0) {
    throw new ImageProcessingError('Image not loaded or invalid')
  }
  
  if (size < 8 || size > 128) {
    throw new ImageProcessingError('Invalid fingerprint size. Must be between 8 and 128.')
  }
  
  try {
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new ImageProcessingError('Cannot get canvas context')
    
    ctx.filter = 'blur(1px)'
    ctx.drawImage(img, 0, 0, size, size)
    
    const { data } = ctx.getImageData(0, 0, size, size)
    const hsvs: number[] = []
    for (let i = 0; i < data.length; i += 4) {
      const [h, s] = rgbToHsv(data[i], data[i+1], data[i+2])
      hsvs.push(h / 360, s)
    }

    const mean = hsvs.reduce((a,b)=>a+b,0)/hsvs.length
    const fingerprint = hsvs.map(v => v - mean)
    
    const canvasDataUrl = canvas.toDataURL()
    
    return { fingerprint, canvas: canvasDataUrl }
  } catch (error) {
    if (error instanceof ImageProcessingError) throw error
    throw new ImageProcessingError(`Failed to generate fingerprint: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}