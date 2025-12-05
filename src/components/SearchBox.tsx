import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CameraIcon, SearchIcon, XIcon } from "lucide-preact";

interface SearchBoxProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBox({ value, onChange }: SearchBoxProps) {
  const handleClear = () => onChange("");

  return (
    <div className="flex items-center justify-center mb-8 sticky top-2 z-10">
      <div className="relative flex items-center gap-2 rounded-full border border-gray-200 shadow-md bg-white p-2 px-4">
        <SearchIcon className="w-4 h-4 mx-2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search by name or tags..."
          value={value}
          onInput={(e) => onChange((e.target as HTMLInputElement).value)}
          className="w-auto rounded-full border-none bg-transparent"
        />
        {value && (
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full h-8 w-8 p-0"
            onClick={handleClear}
          >
            <XIcon className="w-4 h-4" />
          </Button>
        )}

        <CameraButton />
      </div>
    </div>
  );
}

function CameraButton() {
  return (
    <>
      <Button variant="outline" size="icon" className="rounded-full">
        <CameraIcon className="w-4 h-4" />
      </Button>
      <div className="absolute hidden">
        <Button variant="outline" size="icon" className="rounded-full">
          <CameraIcon className="w-4 h-4" />
        </Button>
      </div>
    </>
  );
}
