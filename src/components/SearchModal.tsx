import { useState, useMemo, useRef } from 'preact/hooks'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Search, X, Camera } from 'lucide-preact'
import { type CollectionItem } from '@/types'
import { ItemCard } from './ItemCard'
import { useCamera } from '@/hooks/useCamera'
import { useImageProcessing } from '@/hooks/useImageProcessing'
import { calculateSimilarity } from '@/lib/db'

interface SearchModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  items: CollectionItem[]
}

export function SearchModal({ isOpen, onOpenChange, items }: SearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [showCamera, setShowCamera] = useState(false);
  
  const { isCameraActive, videoRef, startCamera, stopCamera } = useCamera()
  const { capturedImage, imageFingerprint, fingerprintCanvas, processImage, clearImage } = useImageProcessing()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return []
    
    const query = searchQuery.toLowerCase()
    return items.filter(item => 
      item.name.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query)
    )
  }, [items, searchQuery])

  const similarItems = useMemo(() => {
    if (!imageFingerprint) return []
    
    const itemsWithSimilarity = items
      .map(item => ({
        ...item,
        similarity: calculateSimilarity(imageFingerprint as number[], item.fingerprint as number[])
      }))
    
    // Find max Manhattan distance for normalization
    const maxManhattan = Math.max(...itemsWithSimilarity.map(item => item.similarity.manhattan))
    
    // Add normalized match percentage
    return itemsWithSimilarity
      .map(item => ({
        ...item,
        matchPercentage: maxManhattan > 0 ? ((maxManhattan - item.similarity.manhattan) / maxManhattan) * 100 : 0
      }))
      .sort((a, b) => a.similarity.manhattan - b.similarity.manhattan)
  }, [items, imageFingerprint])

  const capturePhoto = async () => {
    if (videoRef.current && canvasRef.current && videoRef.current.readyState >= 2) {
      const video = videoRef.current
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      
      if (ctx) {
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
        setShowCamera(false)
      }
    }
  }

  const handleClose = () => {
    setSearchQuery('')
    onOpenChange(false)
  }

  const toggleCameraSearch = () => {
    setShowCamera(!showCamera)
    if (!showCamera && !isCameraActive) {
      startCamera()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">        
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                type="text"
                placeholder="Search by name or description..."
                value={searchQuery}
                onChange={(e: any) => setSearchQuery(e.currentTarget.value)}
                className="pl-10"
                autoFocus
              />
              {searchQuery && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <Button variant='outline' size="icon" onClick={toggleCameraSearch}>
              <Camera />
            </Button>
            </div>
          </div>
          
          {showCamera && (
            <div className="space-y-2">
              {!capturedImage && !isCameraActive && (
                <Button
                  type="button"
                  onClick={startCamera}
                  className="w-full"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Start Camera
                </Button>
              )}
              
              {isCameraActive && (
                <div className="space-y-2">
                  <video
                    ref={videoRef}
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
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  clearImage()
                  setShowCamera(false)
                }}
                className="w-full"
              >
                <X className="h-4 mr-2" />
                Clear Photo
              </Button>
            </div>
          )}
          
          <div className="space-y-2">
            {searchQuery && (
              <p className="text-sm text-muted-foreground">
                Found {filteredItems.length} result{filteredItems.length !== 1 ? 's' : ''} for "{searchQuery}"
              </p>
            )}
            
            {similarItems.length > 0 && (
              <p className="text-sm text-muted-foreground">
                All {similarItems.length} items ranked by similarity
              </p>
            )}
            
            {filteredItems.length === 0 && searchQuery && similarItems.length === 0 && (
              <div className="text-center py-8">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No items found matching your search.</p>
              </div>
            )}
            
            {filteredItems.length > 0 && (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {filteredItems.map((item) => (
                  <ItemCard key={item.id} item={item} />
                ))}
              </div>
            )}
            
            {similarItems.length > 0 && (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {similarItems.map((item, index) => (
                  <div key={item.id} className={`border rounded-lg p-4 ${item.similarity.isSimilar ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
                    <div className="flex gap-4">
                      <div className="relative">
                        <img
                          src={item.image256}
                          alt={item.name}
                          className="w-16 h-16 rounded-md object-cover bg-black"
                        />
                        <div className="absolute -top-2 -left-2 bg-primary text-primary-foreground text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
                          {index + 1}
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">{item.name}</h3>
                        {item.description && (
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        )}
                        <div className="text-xs text-muted-foreground mt-1 space-y-1">
                          <div className="flex items-center gap-4">
                            <span className={`font-semibold ${item.similarity.isSimilar ? 'text-green-600' : 'text-gray-600'}`}>
                              {item.similarity.isSimilar ? '✓ Similar' : '✗ Different'}
                            </span>
                            <span>Match: {item.matchPercentage.toFixed(1)}%</span>
                          </div>
                          <div className="flex gap-4">
                            <span>Euclidean: {item.similarity.euclidean.toFixed(3)}</span>
                            <span>Cosine: {item.similarity.cosine.toFixed(3)}</span>
                            <span>Manhattan: {item.similarity.manhattan.toFixed(3)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {!searchQuery && similarItems.length === 0 && (
              <div className="text-center py-8">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Type to search your collection or take a photo to find similar items...</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Hidden canvas for photo capture */}
        <canvas ref={canvasRef} className="hidden" />
      </DialogContent>
    </Dialog>
  )
}