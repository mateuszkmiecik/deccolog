import { useEffect } from 'preact/hooks'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { X, Loader2 } from 'lucide-preact'
import { type CollectionItem } from '@/types'
import { TagsInput } from './TagsInput'
import { useTags, type TagItem } from '@/hooks/useTags'
import { CollectionDB } from '@/lib/db'
import { toast } from 'sonner'

const db = new CollectionDB()

interface ImageModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  item: CollectionItem | null
}

export function ImageModal({ isOpen, onOpenChange, item }: ImageModalProps) {
  const queryClient = useQueryClient()

  const {
    selectedTags,
    tagSuggestions,
    isLoading: isLoadingTags,
    fetchQuery,
    setTagInputValue,
    addTag,
    removeTag,
    saveAndAddTag,
    clearTags,
    setSelectedTags,
  } = useTags()

  // Reset tags when item changes or modal opens
  useEffect(() => {
    if (isOpen && item?.tags) {
      // Tags now come with full info (id and name) from the backend
      setSelectedTags(item.tags)
    } else if (!isOpen) {
      clearTags()
    }
  }, [isOpen, item?.id])

  const updateTagsMutation = useMutation({
    mutationFn: async (tagIds: number[]) => {
      if (!item) throw new Error('No item selected')
      await db.updateItemTags(item.id, tagIds)
    },
    onSuccess: () => {
      toast.success('Tags updated successfully')
      queryClient.invalidateQueries({ queryKey: ['items'] })
    },
    onError: (error) => {
      toast.error(`Failed to update tags: ${error.message}`)
    },
  })

  const handleSaveTags = () => {
    const tagIds = selectedTags.map(t => t.id)
    updateTagsMutation.mutate(tagIds)
  }

  const handleClose = () => {
    clearTags()
    onOpenChange(false)
  }

  if (!item) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{item.name}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex justify-center">
            <img
              src={`${item.photoUrl}/raw`}
              alt={item.name}
              className="max-w-full rounded-lg border bg-black"
              style={{ maxHeight: '300px' }}
            />
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <TagsInput
              selectedTags={selectedTags}
              onTagAdd={addTag}
              onTagRemove={removeTag}
              onNewTagCreate={saveAndAddTag}
              tagSuggestions={tagSuggestions}
              isLoading={isLoadingTags}
              fetchQuery={fetchQuery}
              onInputChange={setTagInputValue}
              placeholder="Search or add tags"
            />
          </div>
          
          <div className="text-center text-sm text-muted-foreground">
            <p>Added {new Date(item.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSaveTags}
            disabled={updateTagsMutation.isPending}
          >
            {updateTagsMutation.isPending && (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            )}
            Save Tags
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}