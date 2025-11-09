import { useState, useRef } from 'preact/hooks'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CollectionDB } from '@/lib/db'
import { CloudSyncService } from '@/lib/cloud-sync'
import { generateQRCode, scanQRCode, captureQRCodeFromVideo } from '@/lib/qr-utils'
import { Upload, Download, Camera, QrCodeIcon } from 'lucide-preact'

interface CloudSyncModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  db: CollectionDB
  onSyncComplete: () => void
}

export function CloudSyncModal({ isOpen, onOpenChange, db, onSyncComplete }: CloudSyncModalProps) {
  const [mode, setMode] = useState<'upload' | 'download' | null>(null)
  const [qrCode, setQrCode] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [isScanning, setIsScanning] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const syncService = new CloudSyncService()

  const handleUpload = async () => {
    setIsLoading(true)
    setError('')
    
    try {
      const syncId = await db.uploadCollection()
      const syncUrl = syncService.generateSyncUrl(syncId)
      const qrDataUrl = await generateQRCode(syncUrl)
      setQrCode(qrDataUrl)
      setMode('upload')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = async (event: Event) => {
    const file = (event.target as HTMLInputElement).files?.[0]
    if (!file) return

    setIsLoading(true)
    setError('')

    try {
      const syncUrl = await scanQRCode(file)
      const syncId = syncService.parseSyncUrl(syncUrl)
      
      if (!syncId) {
        throw new Error('Invalid QR code format')
      }

      await db.downloadAndMergeCollection(syncId)
      onSyncComplete()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scan failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCameraScan = async () => {
    if (!videoRef.current) return

    setIsScanning(true)
    setError('')

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        
        const syncUrl = await captureQRCodeFromVideo(videoRef.current)
        const syncId = syncService.parseSyncUrl(syncUrl)
        
        if (!syncId) {
          throw new Error('Invalid QR code format')
        }

        await db.downloadAndMergeCollection(syncId)
        onSyncComplete()
        onOpenChange(false)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Camera scan failed')
    } finally {
      setIsScanning(false)
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }

  const reset = () => {
    setMode(null)
    setQrCode('')
    setError('')
    setIsScanning(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Sync Collection</DialogTitle>
        </DialogHeader>

        {!mode && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Choose how you want to sync your collection
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={handleUpload}
                disabled={isLoading}
                variant="outline"
                className="h-20 flex-col"
              >
                <Upload className="h-6 w-6 mb-2" />
                Upload
              </Button>
              
              <Button
                onClick={() => setMode('download')}
                disabled={isLoading}
                variant="outline"
                className="h-20 flex-col"
              >
                <Download className="h-6 w-6 mb-2" />
                Download
              </Button>
            </div>
          </div>
        )}

        {mode === 'upload' && qrCode && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Scan this QR code on another device
            </p>
            <div className="flex justify-center">
              <img src={qrCode} alt="Sync QR Code" className="w-64 h-64" />
            </div>
            <Button onClick={reset} variant="outline" className="w-full">
              Back
            </Button>
          </div>
        )}

        {mode === 'download' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Scan a QR code from another device
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                variant="outline"
                className="h-20 flex-col"
              >
                <QrCodeIcon className="h-6 w-6 mb-2" />
                From Image
              </Button>
              
              <Button
                onClick={handleCameraScan}
                disabled={isLoading || isScanning}
                variant="outline"
                className="h-20 flex-col"
              >
                <Camera className="h-6 w-6 mb-2" />
                From Camera
              </Button>
            </div>

            {isScanning && (
              <div className="space-y-2">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-64 bg-black rounded-lg"
                />
                <p className="text-sm text-center text-muted-foreground">
                  Position QR code in frame...
                </p>
              </div>
            )}

            <Button onClick={reset} variant="outline" className="w-full">
              Back
            </Button>
          </div>
        )}

        {error && (
          <div className="text-sm text-destructive text-center p-2 bg-destructive/10 rounded">
            {error}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
      </DialogContent>
    </Dialog>
  )
}