import { useState } from 'preact/hooks'
import { type CollectionItem } from '@/lib/db'
import { ItemCard } from './ItemCard'
import { ImageModal } from './ImageModal'

type ViewMode = 'gallery' | 'list'

interface ItemListProps {
  items: CollectionItem[]
}

function GalleryIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  )
}

function ListIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  )
}

function ViewToggle({ viewMode, onChange }: { viewMode: ViewMode; onChange: (mode: ViewMode) => void }) {
  return (
    <div className="flex bg-muted rounded-lg p-1 gap-1">
      <button
        type="button"
        onClick={() => onChange('gallery')}
        className={`p-1.5 rounded-md transition-colors ${
          viewMode === 'gallery' 
            ? 'bg-background shadow-sm text-foreground' 
            : 'text-muted-foreground hover:text-foreground'
        }`}
        aria-label="Gallery view"
      >
        <GalleryIcon className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => onChange('list')}
        className={`p-1.5 rounded-md transition-colors ${
          viewMode === 'list' 
            ? 'bg-background shadow-sm text-foreground' 
            : 'text-muted-foreground hover:text-foreground'
        }`}
        aria-label="List view"
      >
        <ListIcon className="w-4 h-4" />
      </button>
    </div>
  )
}

function ItemRow({ item, onImageClick }: { item: CollectionItem; onImageClick: (item: CollectionItem) => void }) {
  return (
    <div className="flex gap-4 p-3 rounded-lg bg-card border hover:bg-accent/50 transition-colors">
      <div 
        className="w-16 h-16 flex-shrink-0 rounded-md overflow-hidden bg-gray-100 cursor-pointer hover:opacity-80 transition-opacity"
        onClick={() => onImageClick(item)}
      >
        <img
          src={`${item.photoUrl}/raw`}
          alt={item.name}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <h3 className="font-medium truncate">{item.name}</h3>
        <p className="text-xs text-muted-foreground">
          Added {new Date(item.createdAt).toLocaleDateString()}
        </p>
        {item.tags && item.tags.length > 0 && (
          <div className="flex gap-1 mt-1 flex-wrap">
            {item.tags.slice(0, 3).map((tag) => (
              <span key={tag.id} className="text-xs bg-muted px-1.5 py-0.5 rounded">
                {tag.name}
              </span>
            ))}
            {item.tags.length > 3 && (
              <span className="text-xs text-muted-foreground">+{item.tags.length - 3}</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export function ItemList({ items }: ItemListProps) {
  const [selectedItem, setSelectedItem] = useState<CollectionItem | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('gallery')

  return (
    <>
      <div className="space-y-4 mb-6">
        {items.length > 0 && (
          <div className="flex justify-end">
            <ViewToggle viewMode={viewMode} onChange={setViewMode} />
          </div>
        )}

        {items.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No items yet. Click the + button to add your first item!
          </p>
        ) : viewMode === 'gallery' ? (
          <div className="grid grid-cols-2 gap-4 w-full lg:grid-cols-3">
            {items.map((item) => (
              <ItemCard 
                key={item.id} 
                item={item} 
                onImageClick={setSelectedItem}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {items.map((item) => (
              <ItemRow 
                key={item.id} 
                item={item} 
                onImageClick={setSelectedItem}
              />
            ))}
          </div>
        )}
      </div>
      
      <ImageModal
        isOpen={!!selectedItem}
        onOpenChange={(open) => !open && setSelectedItem(null)}
        item={selectedItem}
      />
    </>
  )
}