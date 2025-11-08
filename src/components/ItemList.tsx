import { useState } from 'preact/hooks'
import { type CollectionItem } from '@/lib/db'
import { ItemCard } from './ItemCard'
import { ImageModal } from './ImageModal'

interface ItemListProps {
  items: CollectionItem[]
}

export function ItemList({ items }: ItemListProps) {
  const [selectedItem, setSelectedItem] = useState<CollectionItem | null>(null)
  return (
    <>
      <div className="space-y-4 mb-6">
        <h2 className="text-lg font-semibold">Your Collection ({items.length})</h2>
        {items.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No items yet. Click the + button to add your first item!
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {items.map((item) => (
              <ItemCard 
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