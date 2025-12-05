import { type CollectionItem } from '@/lib/db'

interface ItemCardProps {
  item: CollectionItem
  onImageClick?: (item: CollectionItem) => void
}

export function ItemCard({ item, onImageClick }: ItemCardProps) {
  return (
    <div className="flex gap-4 p-2 rounded-lg flex-col">
      <div className="w-full aspect-square bg-gray-100 rounded-md flex items-center justify-center">
        <img
          src={`${item.photoUrl}/raw`}
          alt={item.name}
          className="w-full rounded-md shadow-lg object-contain bg-white cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => onImageClick?.(item)}
        />
      </div>

      <div className="flex-1">
        <h3 className="font-medium">{item.name}</h3>
        {/* {item.description && (
          <p className="text-sm text-muted-foreground">{item.description}</p>
        )} */}
        <p className="text-xs text-muted-foreground mt-1">
          Added {new Date(item.createdAt).toLocaleDateString()}
        </p>
      </div>
    </div>
  )
}