import { useState } from "preact/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CameraIcon, SearchIcon, XIcon } from "lucide-preact";
import { cn } from "@/lib/utils";

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
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      {/* Trigger button */}
      <Button
        variant="outline"
        size="icon"
        className="rounded-full"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <CameraIcon className="w-4 h-4" />
      </Button>

      <div
        className={cn(
          "absolute pointer-events-none rounded-[20px] h-10 w-10 bg-white right-4 border border-gray-200 transition-all duration-300",
          isExpanded ? "top-0 right-0 rounded-[26px] w-full h-[120px] will-change-transform" : "top-2"
        )}
      >
        <Button
        variant="outline"
        size="icon"
        className="rounded-full"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <CameraIcon className="w-4 h-4" />
      </Button>
      </div>

      {/* Expanded panel - positioned absolute over parent */}
      <div
        className={`
          hidden
          absolute inset-0 rounded-3xl bg-white overflow-hidden
          flex flex-col
          transition-all duration-300 ease-out
          ${
            isExpanded
              ? "opacity-100 scale-100 h-[220px] shadow-lg"
              : "opacity-0 scale-95 h-0 pointer-events-none"
          }
        `}
        style={{
          transformOrigin: "top right",
        }}
      >
        {/* Content with blur animation */}
        <div
          className={`
            flex-1 bg-black/90 rounded-xl m-2 mb-0
            transition-all duration-300 delay-100
            ${isExpanded ? "opacity-100 blur-0" : "opacity-0 blur-md"}
          `}
        />

        {/* Bottom button */}
        <div
          className={`
            p-2 transition-all duration-300 delay-150
            ${
              isExpanded
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-2"
            }
          `}
        >
          <Button
            variant="outline"
            className="w-full rounded-full"
            onClick={() => setIsExpanded(false)}
          >
            <XIcon className="w-4 h-4 mr-2" />
            Close
          </Button>
        </div>
      </div>
    </>
  );
}
