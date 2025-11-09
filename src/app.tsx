import { useState, useEffect } from 'preact/hooks'
import { CollectionDB } from '@/lib/db'
import { type CollectionItem } from '@/types'
import { ItemList } from '@/components/ItemList'
import { AddItemModal } from '@/components/AddItemModal'
import { SearchModal } from '@/components/SearchModal'
import { CloudSyncModal } from '@/components/CloudSyncModal'
import { PlusIcon, SearchIcon, RefreshCwIcon } from 'lucide-preact'

export function App() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isSyncOpen, setIsSyncOpen] = useState(false)
  const [db, setDb] = useState<CollectionDB | null>(null)
  const [items, setItems] = useState<CollectionItem[]>([])

  useEffect(() => {
    const initDB = async () => {
      const database = new CollectionDB()
      await database.init()
      setDb(database)

      const existingItems = await database.getAllItems()
      setItems(existingItems)
    }

    initDB()
  }, [])

  const handleItemAdded = async () => {
    if (db) {
      const updatedItems = await db.getAllItems()
      setItems(updatedItems)
    }
  }

  return (
    <div className="flex h-dvh flex-col items-start justify-start w-screen overflow-auto">
      <div className="p-3">

        <h1 className="text-2xl font-bold mb-4">Collection Management System</h1>
        <div className="flex-1 overflow-auto">
          <ItemList items={items} />
        </div>
        {/* empty spacer for buttons */}
        <div className="h-8"></div>
      </div>

      {/* Fixed search button */}
      <button
        onClick={() => setIsSearchOpen(true)}
        className="fixed bottom-6 left-6 flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-secondary-foreground shadow-lg hover:bg-secondary/90 hover:scale-105 transition-all duration-200"
      >
        <SearchIcon />
      </button>

      {/* Fixed sync button */}
      <button
        onClick={() => setIsSyncOpen(true)}
        className="fixed bottom-6 left-24 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg hover:bg-accent/90 hover:scale-105 transition-all duration-200"
      >
        <RefreshCwIcon />
      </button>

      {/* Fixed plus button with modal */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 hover:scale-105 transition-all duration-200"
      >
        <PlusIcon />
      </button>

      <SearchModal
        isOpen={isSearchOpen}
        onOpenChange={setIsSearchOpen}
        items={items}
      />

      <AddItemModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        onItemAdded={handleItemAdded}
        db={db!}
      />

      <CloudSyncModal
        isOpen={isSyncOpen}
        onOpenChange={setIsSyncOpen}
        db={db!}
        onSyncComplete={handleItemAdded}
      />
    </div>
  )
}