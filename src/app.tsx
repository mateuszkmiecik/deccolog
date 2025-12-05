import { useState, useEffect, useMemo } from "preact/hooks";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2Icon, PlusIcon, SearchIcon } from "lucide-preact";

import { CollectionDB } from "@/lib/db";
import type { CollectionItem } from "@/types";
import { ItemList } from "@/components/ItemList";
import { AddItemModal } from "@/components/AddItemModal";
import { SearchModal } from "@/components/SearchModal";
import { SearchBox } from "@/components/SearchBox";
import { Button } from "@/components/ui/button";
import logo from "@/assets/image.jpeg";

const db = new CollectionDB();

function filterItems(items: CollectionItem[], query: string): CollectionItem[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return items;

  return items.filter((item) => {
    const nameMatches = item.name.toLowerCase().includes(normalizedQuery);
    const tagMatches = item.tags?.some((tag) =>
      tag.name.toLowerCase().includes(normalizedQuery)
    );
    return nameMatches || tagMatches;
  });
}

export function App() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const queryClient = useQueryClient();

  const { data: items, isLoading, error } = useQuery({
    queryKey: ["items"],
    queryFn: () => db.getAllItems(),
    retry: false,
  });

  const filteredItems = useMemo(
    () => (items ? filterItems(items, searchQuery) : []),
    [items, searchQuery]
  );

  useEffect(() => {
    const isUnauthorized = error?.message.includes("401");
    if (isUnauthorized) {
      window.location.href = "/login";
    }
  }, [error]);

  const handleItemAdded = () => {
    queryClient.invalidateQueries({ queryKey: ["items"] });
  };

  const isReady = items && !isLoading;

  return (
    <div className="flex h-dvh flex-col items-start justify-start w-screen overflow-auto">
      <div className="p-3 mx-auto max-w-2xl w-full lg:max-w-5xl">
        <header className="mx-auto flex items-center justify-center mb-4">
          <img src={logo} alt="Logo" className="w-[200px]" />
        </header>

        <main className="flex-1">
          {isReady && <SearchBox value={searchQuery} onChange={setSearchQuery} />}
          {isReady ? (
            <ItemList items={filteredItems} />
          ) : (
            <Loader2Icon className="animate-spin mx-auto" />
          )}
        </main>

        <div className="h-8" />
      </div>

      <FloatingActions
        onSearchClick={() => setIsSearchModalOpen(true)}
        onAddClick={() => setIsAddModalOpen(true)}
      />

      <SearchModal isOpen={isSearchModalOpen} onOpenChange={setIsSearchModalOpen} />
      <AddItemModal
        isOpen={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onItemAdded={handleItemAdded}
        db={db}
      />
    </div>
  );
}

interface FloatingActionsProps {
  onSearchClick: () => void;
  onAddClick: () => void;
}

function FloatingActions({ onSearchClick, onAddClick }: FloatingActionsProps) {
  const baseStyles =
    "fixed bottom-6 flex items-center justify-center shadow-lg hover:scale-105 transition-all duration-200";

  return (
    <>
      <button
        onClick={onSearchClick}
        className={`${baseStyles} left-6 h-14 w-14 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/90`}
      >
        <SearchIcon />
      </button>
      <Button
        onClick={onAddClick}
        className={`${baseStyles} right-6 bg-primary text-primary-foreground hover:bg-primary/90`}
      >
        <PlusIcon className="w-4 h-4 mr-2" />
        Add
      </Button>
    </>
  );
}
