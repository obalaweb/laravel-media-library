import axios from "axios";
import { Upload, X, FileText, Pencil, FileDown } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import MediaSelector from "./media-selector";

interface DocumentUploadProps {
  value?: number | string | null;
  onChange: (value: number | null) => void;
  label?: string;
  mediaType?: "document" | "all";
}

const DocumentUpload = ({ value, onChange, label, mediaType = "document" }: DocumentUploadProps) => {
  const [isMediaSelectorOpen, setIsMediaSelectorOpen] = useState(false);
  const [docUrl, setDocUrl] = useState("");
  const [docName, setDocName] = useState("");
  const [docExt, setDocExt] = useState("");

  useEffect(() => {
    if (value) {
      if (typeof value === 'string' && (value.startsWith('http') || value.startsWith('/'))) {
        setDocUrl(value);
        const name = value.split('/').pop() || "Document";
        setDocName(name);
        setDocExt(name.split('.').pop()?.toUpperCase() || "DOC");
      } else {
        const mediaId = typeof value === 'number' ? value : parseInt(value as string);
        if (!isNaN(mediaId) && mediaId > 0) {
          axios.get(`/admin/media/${mediaId}`, {
            headers: {
              'X-Requested-With': 'XMLHttpRequest',
              'Accept': 'application/json',
            },
          })
          .then((response) => {
            const data = response.data?.media || response.data;
            if (data?.url) {
              setDocUrl(data.url);
              setDocName(data.original_name || data.file_name || data.name || "Document");
              const ext = data.original_name?.split('.').pop() || data.file_name?.split('.').pop() || data.url.split('.').pop();
              setDocExt(ext?.toUpperCase() || "FILE");
            }
          })
          .catch((error) => {
            console.error('Error fetching document media:', error);
            setDocUrl("");
          });
        }
      }
    } else {
      setDocUrl("");
      setDocName("");
      setDocExt("");
    }
  }, [value]);

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setDocUrl("");
    setDocName("");
    setDocExt("");
  };

  const handleSelect = (mediaId: number, mediaUrl: string, originalName?: string) => {
    onChange(mediaId);
    if (mediaUrl) setDocUrl(mediaUrl);
    if (originalName) {
      setDocName(originalName);
      setDocExt(originalName.split('.').pop()?.toUpperCase() || "FILE");
    }
  };

  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{label}</label>}
      <div className="space-y-4">
        {docUrl || value ? (
          <div className="relative group">
            <div className="flex items-center p-4 w-full rounded-xl border-2 border-border bg-card shadow-sm hover:border-primary/50 transition-all duration-300">
              <div className="flex items-center justify-center p-3 rounded-lg bg-primary/10 text-primary mr-4">
                <FileText className="h-8 w-8" />
              </div>
              <div className="flex-1 min-w-0 pr-16 text-left">
                <p className="text-sm font-semibold truncate text-foreground pb-0.5">{docName}</p>
                <div className="flex items-center text-xs space-x-2 text-muted-foreground font-medium">
                  <span className="uppercase tracking-wider font-bold bg-muted px-2 py-0.5 rounded-sm border border-border/50">{docExt}</span>
                  <a href={docUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-primary hover:underline" onClick={(e) => e.stopPropagation()}>
                    <FileDown className="mr-1 h-3 w-3" />
                    Download / View
                  </a>
                </div>
              </div>
            </div>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                type="button"
                variant="secondary"
                size="icon"
                onClick={() => setIsMediaSelectorOpen(true)}
                className="h-8 w-8 hover:bg-primary hover:text-primary-foreground shadow-sm"
                title="Replace File"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={handleRemove}
                className="h-8 w-8 shadow-sm"
                title="Remove File"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div
            className="w-full p-8 rounded-xl border-2 border-dashed border-border bg-muted/30 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-all duration-300 group"
            onClick={() => setIsMediaSelectorOpen(true)}
          >
            <div className="p-3 rounded-full bg-background border border-border/50 shadow-sm text-muted-foreground group-hover:text-primary group-hover:bg-primary/5 transition-colors mb-3">
              <Upload className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-foreground mb-1">
              Select Document
            </p>
            <p className="text-xs text-muted-foreground text-center">
              Click to browse the media library <br /> for your files.
            </p>
          </div>
        )}

        <MediaSelector
          open={isMediaSelectorOpen}
          onOpenChange={setIsMediaSelectorOpen}
          onSelect={handleSelect}
          currentValue={value}
          mediaType={mediaType}
        />
      </div>
    </div>
  );
};

export default DocumentUpload;
