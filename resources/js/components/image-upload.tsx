import axios from "axios";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import MediaSelector from "./media-selector";

interface ImageUploadProps {
  value?: number | string | null;
  onChange: (value: number | null, url?: string | null) => void;
  label?: string;
}

const ImageUpload = ({ value, onChange, label }: ImageUploadProps) => {
  const [isMediaSelectorOpen, setIsMediaSelectorOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
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

  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{label}</label>}
      <div className="space-y-4">
        {imageUrl || value ? (
          <div className="relative group">
            <div className="aspect-video w-full rounded-lg overflow-hidden border border-border bg-muted">
              <img
                src={imageUrl || (typeof value === 'string' ? value : "")}
                alt="Selected"
                className="w-full h-full object-cover"
              />
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
              Click to select image
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
            {value ? "Change Image" : "Select Image"}
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
          currentValue={value}
          mediaType="image"
        />
      </div>
    </div>
  );
};

export default ImageUpload;
