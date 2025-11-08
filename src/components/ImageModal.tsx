import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { X } from 'lucide-preact'
import { type CollectionItem } from '@/types'

interface ImageModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  item: CollectionItem | null
}

export function ImageModal({ isOpen, onOpenChange, item }: ImageModalProps) {
  if (!item) return null

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{item.name}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex justify-center">
            <img
              src={item.image256}
              alt={item.name}
              className="max-w-full rounded-lg border bg-black"
              style={{ maxHeight: '400px' }}
            />
          </div>
          
          {item.description && (
            <div className="text-center">
              <p className="text-muted-foreground">{item.description}</p>
            </div>
          )}
          
          <div className="text-center text-sm text-muted-foreground">
            <p>Added {new Date(item.createdAt).toLocaleDateString()}</p>
            <p>Image size: 256x256 pixels</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}