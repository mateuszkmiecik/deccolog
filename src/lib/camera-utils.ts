/**
 * Camera utility functions for capturing photos from video streams
 */

export async function capturePhotoFromVideo(
  video: HTMLVideoElement,
  targetSize = 256,
  quality = 0.8
): Promise<string> {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Cannot get canvas context')
  
  canvas.width = targetSize
  canvas.height = targetSize
  
  const videoAspect = video.videoWidth / video.videoHeight
  let drawWidth = targetSize
  let drawHeight = targetSize
  let offsetX = 0
  let offsetY = 0
  
  if (videoAspect > 1) {
    drawHeight = targetSize / videoAspect
    offsetY = (targetSize - drawHeight) / 2
  } else {
    drawWidth = targetSize * videoAspect
    offsetX = (targetSize - drawWidth) / 2
  }
  
  ctx.fillStyle = 'black'
  ctx.fillRect(0, 0, targetSize, targetSize)
  ctx.drawImage(video, offsetX, offsetY, drawWidth, drawHeight)
  
  return canvas.toDataURL('image/jpeg', quality)
}