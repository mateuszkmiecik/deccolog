import { type CollectionItem } from '@/lib/db'

interface ItemCardProps {
  item: CollectionItem
  onImageClick?: (item: CollectionItem) => void
}

export function ItemCard({ item, onImageClick }: ItemCardProps) {
  return (
    <div className="flex gap-4 p-2 rounded-lg flex-col">
      <img
        src={item.image256}
        alt={item.name}
        className="w-full aspect-square rounded-md shadow-lg object-cover bg-white cursor-pointer hover:opacity-80 transition-opacity"
        onClick={() => onImageClick?.(item)}
      />
      <div className="flex-1">
        <h3 className="font-medium">{item.name}</h3>
        {item.description && (
          <p className="text-sm text-muted-foreground">{item.description}</p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          Added {new Date(item.createdAt).toLocaleDateString()}
        </p>
      </div>
    </div>
  )
}