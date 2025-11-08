import { useEffect, useRef } from 'preact/hooks'

interface ImageCanvasProps {
  imageData: string
  width?: number
  height?: number
  className?: string
}

export function ImageCanvas({ imageData, width = 256, height = 256, className }: ImageCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  useEffect(() => {
    if (canvasRef.current && imageData) {
      const ctx = canvasRef.current.getContext('2d')
      const img = new Image()
      img.onload = () => {
        if (ctx && canvasRef.current) {
          canvasRef.current.width = width
          canvasRef.current.height = height
          ctx.drawImage(img, 0, 0, width, height)
        }
      }
      img.src = imageData
    }
  }, [imageData, width, height])
  
  return <canvas ref={canvasRef} width={width} height={height} className={className} />
}