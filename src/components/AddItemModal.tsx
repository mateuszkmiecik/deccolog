import { useState, useRef, useCallback, useEffect } from "preact/hooks";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, X, Upload, PlusIcon } from "lucide-preact";
import { CollectionDB } from "@/lib/db";
import { useCamera } from "@/hooks/useCamera";
import { useImageProcessing } from "@/hooks/useImageProcessing";
import { useUploader } from "@/hooks/useUploader";
import { useTags, type TagItem } from "@/hooks/useTags";
import { Badge } from "./ui/badge";
import { Checkbox } from "./ui/checkbox";
import { toast } from "sonner";

interface AddItemModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onItemAdded: () => void;
  db: CollectionDB;
}

// ---- Local hooks (in-file) -------------------------------------------------
// camera + capture logic
function useCapture(processImage: (dataUrl: string) => Promise<any>) {
  const { isCameraActive, videoRef, startCamera, stopCamera } = useCamera();
  const hiddenCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const videoRefCallback = useCallback(
    (el: HTMLVideoElement | null) => {
      videoRef.current = el;
    },
    [videoRef]
  );

  const canvasRefCallback = useCallback((el: HTMLCanvasElement | null) => {
    hiddenCanvasRef.current = el;
  }, []);

  const waitForVideoReady = async (video: HTMLVideoElement, timeout = 2000) => {
    const start = Date.now();
    return new Promise<void>((resolve, reject) => {
      const check = () => {
        if (video.readyState >= 2 && video.videoWidth > 0) return resolve();
        if (Date.now() - start > timeout)
          return reject(new Error("video not ready"));
        requestAnimationFrame(check);
      };
      check();
    });
  };

  const drawVideoToHiddenCanvas = (
    video: HTMLVideoElement,
    canvas: HTMLCanvasElement
  ) => {
    canvas.width = 256;
    canvas.height = 256;

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No 2D context");

    const videoAspect = video.videoWidth / video.videoHeight;
    let drawWidth = 256;
    let drawHeight = 256;
    let offsetX = 0;
    let offsetY = 0;

    if (videoAspect > 1) {
      drawHeight = 256 / videoAspect;
      offsetY = (256 - drawHeight) / 2;
    } else {
      drawWidth = 256 * videoAspect;
      offsetX = (256 - drawWidth) / 2;
    }

    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, 256, 256);
    ctx.drawImage(video, offsetX, offsetY, drawWidth, drawHeight);
    return canvas.toDataURL("image/jpeg", 0.8);
  };

  const capturePhoto = useCallback(async () => {
    const video = videoRef.current;
    const canvas = hiddenCanvasRef.current;
    if (!video || !canvas) {
      throw new Error("camera not available");
    }

    await waitForVideoReady(video);
    const imageData = drawVideoToHiddenCanvas(video, canvas);
    await processImage(imageData);
    stopCamera();
  }, [videoRef, hiddenCanvasRef, processImage, stopCamera]);

  return {
    isCameraActive,
    videoRefCallback,
    canvasRefCallback,
    startCamera,
    stopCamera,
    capturePhoto,
    hiddenCanvasRef,
  };
}

function useFileUploader(
  processImage: (dataUrl: string, fileName?: string) => Promise<any>
) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const readFileAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });

  const handleFileUpload = useCallback(
    async (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (!file) return;

      const imageData = await readFileAsDataUrl(file);
      await processImage(imageData, file.name);
    },
    [processImage]
  );

  return { fileInputRef, handleFileUpload };
}

export function AddItemModal({ isOpen, onOpenChange, db, onItemAdded }: AddItemModalProps) {
  const [itemDetails, setItemDetails] = useState<{
    name: string;
    description: string;
  }>({ name: "", description: "" });
  const [error, setError] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState("");
  const tagInputRef = useRef<HTMLInputElement | null>(null);

  const clearItemDetails = () => setItemDetails({ name: "", description: "" });
  const setItemName = (name: string) => setItemDetails((d) => ({ ...d, name }));

  // (capture logic is moved to useCapture below)
  const {
    capturedImage,
    imageFingerprint,
    fingerprintCanvas,
    processImage,
    clearImage,
  } = useImageProcessing();
  const { uploadDataUrl } = useUploader();
  const {
    tagSuggestions,
    fetchQuery,
    isLoading,
    selectedTags,
    setTagInputValue,
    addTag,
    saveAndAddTag,
    removeTag,
    clearTags,
  } = useTags();

  // upload status & remote url
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "uploading" | "done" | "error"
  >("idle");
  const [remoteImageUrl, setRemoteImageUrl] = useState<string | null>(null);

  const [continueAdding, setContinueAdding] = useState(false);

  // instantiate local hooks using useImageProcessing's processImage
  // wrap the base processImage so we upload the same dataUrl afterwards (if available)
  const processImageAndUpload = useCallback(
    async (imageSource: string | HTMLImageElement, fileName?: string) => {
      // run the fingerprint/processing first
      const result = await processImage(imageSource);

      // only attempt upload for dataURL strings
      if (typeof imageSource === "string") {
        // if no token is available in the hook it will return null and do nothing
        try {
          setUploadStatus("uploading");
          const res = await uploadDataUrl(imageSource, fileName);
          if (!res?.success) {
            throw new Error("Error happened while uploading an image");
          }

          // try common returned properties
          if (res.success) {
            setRemoteImageUrl(res.data.url);
            setUploadStatus("done");
          } else {
            setRemoteImageUrl(null);
            setUploadStatus("error");
          }
        } catch (e) {
          setRemoteImageUrl(null);
          setUploadStatus("error");
        }
      }

      return result;
    },
    [processImage, uploadDataUrl]
  );

  const { fileInputRef, handleFileUpload: uploaderHandleFile } =
    useFileUploader(processImageAndUpload);

  const capture = useCapture(processImageAndUpload);
  // forward refs and functions from the local hooks (keep original names so usage stays consistent)
  const {
    videoRefCallback,
    canvasRefCallback,
    capturePhoto: captureFromHook,
    isCameraActive,
    startCamera,
    stopCamera,
  } = capture;
  const capturePhoto = useCallback(async () => {
    try {
      await captureFromHook();
      setError(null);
    } catch (err) {
      setError("Failed to capture photo");
    }
  }, [captureFromHook]);

  const handleFileUpload = useCallback(
    async (e: Event) => {
      try {
        await uploaderHandleFile(e);
        setError(null);
      } catch (err) {
        setError("Failed to process image");
      }
    },
    [uploaderHandleFile]
  );

  const handleAddItem = async () => {
    setError(null);

    if (!capturedImage || !imageFingerprint || !remoteImageUrl) {
      setError("Please capture or upload an image before adding to collection");
      return;
    }

    try {
      await db.addItem({
        ...itemDetails,
        fingerprint: imageFingerprint,
        photoUrl: remoteImageUrl,
        tags: selectedTags.map((t) => t.id),
      });

      toast.success("Item added to collection");

      clearItemDetails();
      clearImage();
      onItemAdded();

      if (!continueAdding) {
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Error adding item:", error);
      // Keep user-facing error message stable for tests / UX
      setError("Failed to add item to collection");
    }
  };

  const handleClose = () => {
    setError(null);
    clearItemDetails();
    clearImage();
    clearTags();
    setTagInput("");
    stopCamera();
  };

  const handleTagInputChange = (value: string) => {
    setTagInput(value);
    setTagInputValue(value);
  };

  const handleTagSelect = (tag: TagItem) => {
    addTag(tag);
    setTagInput("");
  };

  const handleTagRemove = (tag: TagItem) => {
    removeTag(tag);
  };

  // Draw capturedImage into the preview canvas when it changes
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas || !capturedImage) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = 256;
      canvas.height = 256;
      ctx.drawImage(img, 0, 0, 256, 256);
    };
    img.src = capturedImage;
  }, [capturedImage]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] sm:w-[500px] max-h-[90vh] overflow-hidden overflow-y-auto flex flex-col">
        <DialogHeader>
          <DialogTitle>Add to Collection</DialogTitle>
          <DialogDescription>
            Add a new item to your collection. Fill in the details below.
          </DialogDescription>
        </DialogHeader>
        <div>
          {error && (
            <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
              {error}
            </div>
          )}
          <div className="flex flex-col w-full flex-1">
            <Input
              id="name"
              name="name"
              value={itemDetails.name}
              onChange={(e) => setItemName(e.currentTarget.value)}
              className="col-span-3"
              placeholder="Enter item name"
            />
            <Input
              id="tags"
              name="tags"
              ref={tagInputRef}
              value={tagInput}
              onChange={(e) =>
                handleTagInputChange(e.currentTarget.value.toLowerCase())
              }
              className="col-span-3 mt-2"
              placeholder="Search tags"
              inputMode="text"
              size={10}
            />
            <div className="relative mt-1 flex gap-1 py-2">
              {selectedTags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant="secondary"
                  className="flex items-center gap-1 cursor-pointer"
                  onClick={() => {
                    handleTagRemove(tag);
                    tagInputRef.current?.focus();
                  }}
                >
                  {tag.name}
                  <X className="w-3 h-3" />
                </Badge>
              ))}
              {tagSuggestions.length > 0 &&
                tagSuggestions
                  .filter(
                    (t) => !selectedTags.map((st) => st.id).includes(t.id)
                  )
                  .map((tag) => (
                    <Badge
                      key={tag.id}
                      className="cursor-pointer border-primary"
                      variant="outline"
                      onClick={() => {
                        handleTagSelect(tag);
                        tagInputRef.current?.focus();
                      }}
                    >
                      {tag.name}
                    </Badge>
                  ))}
              {tagInput.length > 0 &&
                tagInput === fetchQuery &&
                tagSuggestions &&
                !isLoading &&
                tagSuggestions?.every((v) => v.name !== tagInput) && (
                  <Badge
                    className="cursor-pointer px-1 pr-2"
                    onClick={() => saveAndAddTag(tagInput)}
                  >
                    <PlusIcon size={16} className="mr-1" /> {tagInput}
                  </Badge>
                )}
            </div>
          </div>
          <div className="grid gap-4 py-4">
            <div className="col-span-4 space-y-2">
              <Label>Photo</Label>
              {!capturedImage && !isCameraActive && (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={startCamera}
                    className="flex-1"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Take Photo
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              )}

              {isCameraActive && (
                <div className="space-y-2">
                  <video
                    ref={videoRefCallback}
                    autoPlay
                    playsInline
                    muted
                    className="w-full rounded-md border bg-black"
                    style={{ minHeight: "200px" }}
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={capturePhoto}
                      className="flex-1"
                    >
                      Capture
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={stopCamera}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {capturedImage && (
                <div className="space-y-2">
                  <div className="flex gap-4 justify-center">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-2">
                        256x256
                      </p>
                      <canvas
                        ref={previewCanvasRef}
                        width={256}
                        height={256}
                        className="rounded-md border bg-black"
                      />
                    </div>
                    {fingerprintCanvas && (
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground mb-2">
                          Fingerprint (32x32)
                        </p>
                        <img
                          src={fingerprintCanvas}
                          alt="Fingerprint"
                          width={64}
                          height={64}
                          className="rounded-md border bg-black"
                          style={{ imageRendering: "pixelated" }}
                        />
                      </div>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={clearImage}
                    className="w-full"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Remove Photo
                  </Button>
                  {uploadStatus === "uploading" && (
                    <div className="text-xs text-muted-foreground text-center mt-1">
                      Uploading…
                    </div>
                  )}
                  {uploadStatus === "done" && remoteImageUrl && (
                    <div className="text-xs text-muted-foreground text-center mt-1">
                      Uploaded ✓
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-row">
          <div className="flex items-center flex-1 gap-2">
            <Checkbox
              id="terms"
              checked={continueAdding}
              onCheckedChange={(checked) => setContinueAdding(!!checked)}
            />
            <Label htmlFor="terms" className="text-xs">
              Continuous adding
            </Label>
          </div>
          <div>
            <Button variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" onClick={handleAddItem}>
              Add Item
            </Button>
          </div>
        </DialogFooter>

        {/* Hidden canvas for photo capture */}
        <canvas ref={canvasRefCallback} className="hidden" />
      </DialogContent>
    </Dialog>
  );
}
