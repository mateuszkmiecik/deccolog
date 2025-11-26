import { useState, useEffect } from "preact/hooks";
import { CollectionDB } from "@/lib/db";
import { type CollectionItem } from "@/types";
import { ItemList } from "@/components/ItemList";
import { AddItemModal } from "@/components/AddItemModal";
import { SearchModal } from "@/components/SearchModal";
import { PlusIcon, SearchIcon } from "lucide-preact";

import logo from "@/assets/image.jpeg";
import { Button } from "./components/ui/button";

export function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const [db, setDb] = useState<CollectionDB | null>(null);
  const [items, setItems] = useState<CollectionItem[]>([]);

  useEffect(() => {
    const initDB = async () => {
      const database = new CollectionDB();
      await database.init();
      setDb(database);

      const existingItems = await database.getAllItems();
      setItems(existingItems);
    };

    initDB();
  }, []);

  const handleItemAdded = async () => {
    if (db) {
      const updatedItems = await db.getAllItems();
      setItems(updatedItems);
    }
  };

  return (
    <div className="flex h-dvh flex-col items-start justify-start w-screen overflow-auto">
      <div className="p-3 mx-auto">
        <div className="mx-auto flex items-center justify-center mb-4">
          <img src={logo} className="w-[200px]" />
        </div>
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

      {/* Fixed plus button with modal */}
      <Button
        onClick={() => setIsModalOpen(true)}
        variant="secondary"
        className="fixed bottom-6 right-6 flex items-center justify-center bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 hover:scale-105 transition-all duration-200"
      >
        <PlusIcon className="w-4 h-4 mr-3" /> Add
      </Button>

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
    </div>
  );
}
