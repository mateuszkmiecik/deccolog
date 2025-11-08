import { useState, useRef } from 'preact/hooks'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Camera, X, Upload } from 'lucide-preact'
import { CollectionDB } from '@/lib/db'
import { useCamera } from '@/hooks/useCamera'
import { useImageProcessing } from '@/hooks/useImageProcessing'

interface AddItemModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onItemAdded: () => void
  db: CollectionDB
}

export function AddItemModal({ isOpen, onOpenChange, onItemAdded, db }: AddItemModalProps) {
  const [itemName, setItemName] = useState('')
  const [itemDescription, setItemDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  
  const { isCameraActive, videoRef, startCamera, stopCamera } = useCamera()
  
  // Custom video ref to ensure stream is set when element mounts
  const videoRefCallback = (element: HTMLVideoElement | null) => {
    videoRef.current = element
    if (element && isCameraActive) {
      console.log('Video element mounted, camera is active')
      // Give it a moment to set the stream
      setTimeout(() => {
        if (element.srcObject) {
          console.log('Stream already set on video element')
        } else {
          console.log('No stream on video element, restarting camera')
          startCamera()
        }
      }, 100)
    }
  }
  const { capturedImage, imageFingerprint, fingerprintCanvas, processImage, clearImage } = useImageProcessing()
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Ensure canvas is created when component mounts
  const canvasRefCallback = (element: HTMLCanvasElement | null) => {
    canvasRef.current = element
    if (element) {
      console.log('Canvas element mounted')
    }
  }

  const capturePhoto = async () => {
    console.log('Capture photo called')
    console.log('videoRef.current:', videoRef.current)
    console.log('canvasRef.current:', canvasRef.current)
    
    if (!videoRef.current || !canvasRef.current) {
      setError('Camera not available')
      return
    }

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    
    console.log('video.readyState:', video.readyState)
    console.log('video.videoWidth:', video.videoWidth, 'video.videoHeight:', video.videoHeight)
    
    if (!ctx) {
      setError('Cannot capture photo')
      return
    }

    // Wait for video to be ready
    if (video.readyState < 2 || video.videoWidth === 0) {
      console.log('Video not ready, waiting...')
      const waitForVideo = () => {
        if (video.readyState >= 2 && video.videoWidth > 0) {
          console.log('Video ready now, capturing...')
          capturePhoto()
        } else {
          setTimeout(waitForVideo, 100)
        }
      }
      waitForVideo()
      return
    }

    try {
      canvas.width = 256
      canvas.height = 256
      
      const videoAspect = video.videoWidth / video.videoHeight
      let drawWidth = 256
      let drawHeight = 256
      let offsetX = 0
      let offsetY = 0
      
      if (videoAspect > 1) {
        drawHeight = 256 / videoAspect
        offsetY = (256 - drawHeight) / 2
      } else {
        drawWidth = 256 * videoAspect
        offsetX = (256 - drawWidth) / 2
      }
      
      ctx.fillStyle = 'black'
      ctx.fillRect(0, 0, 256, 256)
      ctx.drawImage(video, offsetX, offsetY, drawWidth, drawHeight)
      
      const imageData = canvas.toDataURL('image/jpeg', 0.8)
      
      await processImage(imageData)
      stopCamera()
    } catch (error) {
      console.error('Error capturing photo:', error)
      setError('Failed to capture photo')
    }
  }

  const handleFileUpload = async (e: Event) => {
    const target = e.target as HTMLInputElement
    const file = target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const imageData = e.target?.result as string
        try {
          await processImage(imageData)
          setError(null)
        } catch (err) {
          setError('Failed to process image')
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAddItem = async () => {
    setError(null)
    
    if (!capturedImage || !imageFingerprint) {
      setError('Please capture an image before adding to collection')
      return
    }

    try {
      await db.addItem({
        name: itemName,
        description: itemDescription,
        image256: capturedImage,
        fingerprint: imageFingerprint
      })

      setItemName('')
      setItemDescription('')
      clearImage()
      onOpenChange(false)
      onItemAdded()
    } catch (error) {
      console.error('Error adding item:', error)
      setError('Failed to add item to collection')
    }
  }

  const handleClose = () => {
    setError(null)
    setItemName('')
    setItemDescription('')
    clearImage()
    stopCamera()
    onOpenChange(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add to Collection</DialogTitle>
          <DialogDescription>
            Add a new item to your collection. Fill in the details below.
          </DialogDescription>
        </DialogHeader>
        
        {error && (
          <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
            {error}
          </div>
        )}
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Name</Label>
            <Input
              id="name"
              value={itemName}
              onChange={(e: any) => setItemName(e.currentTarget.value)}
              className="col-span-3"
              placeholder="Enter item name"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">Description</Label>
            <Input
              id="description"
              value={itemDescription}
              onChange={(e: any) => setItemDescription(e.currentTarget.value)}
              className="col-span-3"
              placeholder="Enter item description"
            />
          </div>
          
          <div className="col-span-4 space-y-2">
            <Label>Photo</Label>
            {!capturedImage && !isCameraActive && (
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={startCamera} className="flex-1">
                  <Camera className="w-4 h-4 mr-2" />
                  Take Photo
                </Button>
                <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} className="flex-1">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            )}
            
            {isCameraActive && (
              <div className="space-y-2">
                <video
                  ref={videoRefCallback}
                  autoPlay
                  playsInline
                  muted
                  className="w-full rounded-md border bg-black"
                  style={{ minHeight: '200px' }}
                />
                <div className="flex gap-2">
                  <Button type="button" onClick={capturePhoto} className="flex-1">
                    Capture
                  </Button>
                  <Button type="button" variant="outline" onClick={stopCamera} className="flex-1">
                    Cancel
                  </Button>
                </div>
              </div>
            )}
            
            {capturedImage && (
              <div className="space-y-2">
                <div className="flex gap-4 justify-center">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">256x256</p>
                    <canvas
                      ref={(canvas) => {
                        if (canvas && capturedImage) {
                          const ctx = canvas.getContext('2d')
                          const img = new Image()
                          img.onload = () => {
                            canvas.width = 256
                            canvas.height = 256
                            ctx?.drawImage(img, 0, 0, 256, 256)
                          }
                          img.src = capturedImage
                        }
                      }}
                      width={256}
                      height={256}
                      className="rounded-md border bg-black"
                    />
                  </div>
                  {fingerprintCanvas && (
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-2">Fingerprint (32x32)</p>
                      <img
                        src={fingerprintCanvas}
                        alt="Fingerprint"
                        width={64}
                        height={64}
                        className="rounded-md border bg-black"
                        style={{ imageRendering: 'pixelated' }}
                      />
                    </div>
                  )}
                </div>
                <Button type="button" variant="outline" onClick={clearImage} className="w-full">
                  <X className="w-4 h-4 mr-2" />
                  Remove Photo
                </Button>
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button type="submit" onClick={handleAddItem}>
            Add Item
          </Button>
        </DialogFooter>
        
        {/* Hidden canvas for photo capture */}
        <canvas ref={canvasRefCallback} className="hidden" />
      </DialogContent>
    </Dialog>
  )
}