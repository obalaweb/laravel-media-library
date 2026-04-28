import axios from "axios";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import MediaSelector from "./media-selector";

interface ImageUploadProps {
  value?: number | string | Array<number | string> | null;
  onChange: (value: number | null, url?: string | null) => void;
  onChangeMultiple?: (items: Array<{ id: number; url: string }>) => void;
  label?: string;
  multiple?: boolean;
}

const ImageUpload = ({ value, onChange, onChangeMultiple, label, multiple = false }: ImageUploadProps) => {
  const [isMediaSelectorOpen, setIsMediaSelectorOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  useEffect(() => {
    if (Array.isArray(value)) {
      const directUrls = value.filter((item): item is string => typeof item === 'string' && (item.startsWith('http') || item.startsWith('/')));
      setImageUrls(directUrls);
      setImageUrl(directUrls[0] ?? "");
      return;
    }

    if (value) {
      if (typeof value === 'string' && (value.startsWith('http') || value.startsWith('/'))) {
        setImageUrl(value);
      } else {
        const mediaId = typeof value === 'number' ? value : parseInt(value);
        if (!isNaN(mediaId) && mediaId > 0) {
          axios.get(`/builder/media/${mediaId}`, {
            headers: {
              'X-Requested-With': 'XMLHttpRequest',
              'Accept': 'application/json',
            },
          })
          .then((response) => {
            const url = response.data?.media?.url || response.data?.url;
            if (url) {
              setImageUrl(url);
            }
          })
          .catch((error) => {
            console.error('Error fetching media:', error);
            setImageUrl("");
          });
        }
      }
    } else {
      setImageUrl("");
      setImageUrls([]);
    }
  }, [value]);

  const handleRemove = () => {
    onChange(null, null);
    setImageUrl("");
  };

  const handleSelect = (mediaId: number, mediaUrl: string) => {
    onChange(mediaId, mediaUrl);
    if (mediaUrl) {
      setImageUrl(mediaUrl);
    }
  };

  const handleSelectMultiple = (items: Array<{ id: number; url: string }>) => {
    setImageUrls(items.map((item) => item.url));
    setImageUrl(items[0]?.url ?? "");
    onChangeMultiple?.(items);
  };

  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{label}</label>}
      <div className="space-y-4">
        {(multiple ? imageUrls.length > 0 : (imageUrl || value)) ? (
          <div className="relative group">
            <div className={`${multiple ? "grid grid-cols-2 md:grid-cols-3 gap-2" : "aspect-video"} w-full rounded-lg overflow-hidden border border-border bg-muted p-2`}>
              {(multiple ? imageUrls : [imageUrl || (typeof value === 'string' ? value : "")]).filter(Boolean).map((url, idx) => (
                <img
                  key={`${url}-${idx}`}
                  src={url}
                  alt="Selected"
                  className={`${multiple ? "aspect-square w-full object-cover rounded" : "w-full h-full object-cover"}`}
                />
              ))}
            </div>
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="destructive"
                size="icon"
                onClick={handleRemove}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div
            className="aspect-video w-full rounded-lg border-2 border-dashed border-border bg-muted/50 flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-muted transition-colors"
            onClick={() => setIsMediaSelectorOpen(true)}
          >
            <ImageIcon className="h-12 w-12 text-muted-foreground mb-2" />
            <p className="text-sm font-medium text-muted-foreground mb-1">
              {multiple ? "Click to select images" : "Click to select image"}
            </p>
            <p className="text-xs text-muted-foreground">
              Choose from media library
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => setIsMediaSelectorOpen(true)}
          >
            <Upload className="h-4 w-4 mr-2" />
            {multiple ? "Select Images" : (value ? "Change Image" : "Select Image")}
          </Button>
          {value && (
            <Button
              type="button"
              variant="outline"
              onClick={handleRemove}
            >
              <X className="h-4 w-4 mr-2" />
              Remove
            </Button>
          )}
        </div>

        <MediaSelector
          open={isMediaSelectorOpen}
          onOpenChange={setIsMediaSelectorOpen}
          onSelect={handleSelect}
          onSelectMultiple={handleSelectMultiple}
          currentValue={value}
          mediaType="image"
          multiple={multiple}
        />
      </div>
    </div>
  );
};

export default ImageUpload;
