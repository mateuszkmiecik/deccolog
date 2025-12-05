import { useRef, useState } from "preact/hooks";
import { X, PlusIcon } from "lucide-preact";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useTags, type TagItem } from "@/hooks/useTags";

interface TagsInputProps {
  selectedTags: TagItem[];
  onTagAdd: (tag: TagItem) => void;
  onTagRemove: (tag: TagItem) => void;
  onNewTagCreate: (tagName: string) => void;
  tagSuggestions: TagItem[];
  isLoading: boolean;
  fetchQuery: string;
  onInputChange: (value: string) => void;
  placeholder?: string;
}

export function TagsInput({
  selectedTags,
  onTagAdd,
  onTagRemove,
  onNewTagCreate,
  tagSuggestions,
  isLoading,
  fetchQuery,
  onInputChange,
  placeholder = "Search tags",
}: TagsInputProps) {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleInputChange = (value: string) => {
    setInputValue(value);
    onInputChange(value);
  };

  const handleTagSelect = (tag: TagItem) => {
    onTagAdd(tag);
    setInputValue("");
    inputRef.current?.focus();
  };

  const handleTagRemove = (tag: TagItem) => {
    onTagRemove(tag);
    inputRef.current?.focus();
  };

  const handleNewTagCreate = () => {
    onNewTagCreate(inputValue);
    setInputValue("");
  };

  const filteredSuggestions = tagSuggestions.filter(
    (t) => !selectedTags.some((st) => st.id === t.id)
  );

  const showCreateOption =
    inputValue.length > 0 &&
    inputValue === fetchQuery &&
    !isLoading &&
    tagSuggestions.every((v) => v.name !== inputValue);

  return (
    <div className="space-y-2">
      <Input
        ref={inputRef}
        value={inputValue}
        onChange={(e) => handleInputChange(e.currentTarget.value.toLowerCase())}
        placeholder={placeholder}
        inputMode="text"
        size={10}
      />
      <div className="flex flex-wrap gap-1">
        {selectedTags.map((tag) => (
          <Badge
            key={tag.id}
            variant="secondary"
            className="flex items-center gap-1 cursor-pointer"
            onClick={() => handleTagRemove(tag)}
          >
            {tag.name}
            <X className="w-3 h-3" />
          </Badge>
        ))}
        {filteredSuggestions.map((tag) => (
          <Badge
            key={tag.id}
            className="cursor-pointer border-primary"
            variant="outline"
            onClick={() => handleTagSelect(tag)}
          >
            {tag.name}
          </Badge>
        ))}
        {showCreateOption && (
          <Badge className="cursor-pointer px-1 pr-2" onClick={handleNewTagCreate}>
            <PlusIcon size={16} className="mr-1" /> {inputValue}
          </Badge>
        )}
      </div>
    </div>
  );
}

// Hook-connected version for simpler usage
interface UseTagsInputProps {
  initialTags?: TagItem[];
  placeholder?: string;
}

export function useTagsInput(props?: UseTagsInputProps) {
  const tagsHook = useTags();

  // Set initial tags if provided
  if (props?.initialTags && tagsHook.selectedTags.length === 0) {
    tagsHook.setSelectedTags(props.initialTags);
  }

  const TagsInputComponent = () => (
    <TagsInput
      selectedTags={tagsHook.selectedTags}
      onTagAdd={tagsHook.addTag}
      onTagRemove={tagsHook.removeTag}
      onNewTagCreate={tagsHook.saveAndAddTag}
      tagSuggestions={tagsHook.tagSuggestions}
      isLoading={tagsHook.isLoading}
      fetchQuery={tagsHook.fetchQuery}
      onInputChange={tagsHook.setTagInputValue}
      placeholder={props?.placeholder}
    />
  );

  return {
    ...tagsHook,
    TagsInputComponent,
  };
}
