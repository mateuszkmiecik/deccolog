import { useState, useEffect } from "preact/hooks";
import { CollectionDB } from "@/lib/db";

import { ItemList } from "@/components/ItemList";
import { AddItemModal } from "@/components/AddItemModal";
import { SearchModal } from "@/components/SearchModal";
import { Loader2Icon, PlusIcon, SearchIcon } from "lucide-preact";

import logo from "@/assets/image.jpeg";
import { Button } from "./components/ui/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const db = new CollectionDB();

export function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const { data: items, isLoading, error } = useQuery({
    queryKey: ['items'],
    queryFn: () => db.getAllItems(),
    retry: false,
  })

  useEffect(() => {
    if (error) {
      const isUnauthorized = error.message.includes("401");
      if (isUnauthorized) {
        window.location.href = "/login";
      }
    }
  }, [error])


  const queryClient = useQueryClient();
  const handleItemAdded = async () => {
    queryClient.invalidateQueries({ queryKey: ['items'] })
  };

  return (
    <div className="flex h-dvh flex-col items-start justify-start w-screen overflow-auto">
      <div className="p-3 mx-auto max-w-2xl w-full lg:max-w-5xl">
        <div className="mx-auto flex items-center justify-center mb-4">
          <img src={logo} className="w-[200px]" />
        </div>
        <div className="flex-1">
          {!items || isLoading ? <Loader2Icon className="animate-spin mx-auto" /> : <ItemList items={items} />}
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
