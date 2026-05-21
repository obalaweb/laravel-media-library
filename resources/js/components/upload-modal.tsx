import axios from "axios";
import { Upload, X, Check, FileText, Video, Image as ImageIcon, AlertCircle, Loader2, CloudRain, Music } from "lucide-react";
import { useState, useRef, useCallback } from "react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";

interface UploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface QueuedFile {
  id: string;
  file: File;
  progress: number;
  status: "pending" | "uploading" | "completed" | "error";
  error?: string;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function getFileIcon(type: string) {
  if (type.startsWith("image/")) return <ImageIcon className="h-6 w-6 text-primary" />;
  if (type.startsWith("video/")) return <Video className="h-6 w-6 text-purple-500" />;
  if (type.startsWith("audio/")) return <Music className="h-6 w-6 text-blue-500" />;
  return <FileText className="h-6 w-6 text-orange-500" />;
}

export function UploadModal({ open, onOpenChange, onSuccess }: UploadModalProps) {
  const [files, setFiles] = useState<QueuedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !isUploading) {
      setFiles([]);
    }
    onOpenChange(newOpen);
  };

  const addFiles = (selectedFiles: FileList | File[]) => {
    const newQueued = Array.from(selectedFiles).map((file) => ({
      id: Math.random().toString(36).substring(7) + "-" + file.name,
      file,
      progress: 0,
      status: "pending" as const,
    }));
    setFiles((curr) => [...curr, ...newQueued]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
      e.target.value = "";
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  }, []);

  const removeFile = (id: string) => {
    if (isUploading) return;
    setFiles((curr) => curr.filter((f) => f.id !== id));
  };

  const uploadAll = async () => {
    const pendingFiles = files.filter((f) => f.status === "pending" || f.status === "error");
    if (pendingFiles.length === 0) return;

    setIsUploading(true);
    let anySuccess = false;

    for (const item of pendingFiles) {
      setFiles((curr) =>
        curr.map((f) => (f.id === item.id ? { ...f, status: "uploading", progress: 0, error: undefined } : f))
      );

      const formData = new FormData();
      formData.append("files[]", item.file);

      try {
        await axios.post("/builder/media", formData, {
          headers: {
            "X-Requested-With": "XMLHttpRequest",
            Accept: "application/json",
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent) => {
            const progress = progressEvent.total
              ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
              : 0;
            setFiles((curr) => curr.map((f) => (f.id === item.id ? { ...f, progress } : f)));
          },
        });

        setFiles((curr) => curr.map((f) => (f.id === item.id ? { ...f, status: "completed", progress: 100 } : f)));
        anySuccess = true;
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || err.message || "Upload failed";
        setFiles((curr) => curr.map((f) => (f.id === item.id ? { ...f, status: "error", error: errorMessage } : f)));
      }
    }

    setIsUploading(false);
    if (anySuccess) {
      onSuccess?.();
    }
  };

  const pendingCount = files.filter((f) => f.status === "pending" || f.status === "error").length;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl bg-popover text-popover-foreground">
        <DialogHeader>
          <DialogTitle>Upload Media Files</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 my-2">
          {/* Dropzone Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 ${
              isDragOver
                ? "border-primary bg-primary/10 scale-[1.01]"
                : "border-border bg-muted/30 hover:border-primary/60 hover:bg-muted/60"
            } ${isUploading ? "pointer-events-none opacity-60" : ""}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileSelect}
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
            />
            <div className="mx-auto w-16 h-16 mb-4 rounded-full bg-background flex items-center justify-center shadow-sm border border-border/60">
              <CloudRain className={`h-8 w-8 ${isDragOver ? "text-primary animate-bounce" : "text-muted-foreground"}`} />
            </div>
            <p className="text-lg font-semibold mb-1 text-foreground">Drag & drop files here</p>
            <p className="text-sm text-muted-foreground mb-1">or click to browse your desktop</p>
            <p className="text-xs text-muted-foreground/80 mb-4">Note: Video files are limited to 50MB max</p>
            <Button type="button" variant="outline" size="sm" disabled={isUploading}>
              <Upload className="h-4 w-4 mr-2" /> Select Files
            </Button>
          </div>

          {/* Queued Files List */}
          {files.length > 0 && (
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1 divide-y divide-border/60">
              <div className="flex items-center justify-between text-xs text-muted-foreground pb-2 px-1 font-medium">
                <span>Queued Files ({files.length})</span>
                {pendingCount > 0 && <span>{pendingCount} waiting for upload</span>}
              </div>
              {files.map((item) => (
                <div key={item.id} className="pt-3 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    {getFileIcon(item.file.type)}
                  </div>

                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium truncate text-foreground">{item.file.name}</p>
                      <span className="text-xs text-muted-foreground ml-2 font-mono shrink-0">
                        {formatFileSize(item.file.size)}
                      </span>
                    </div>

                    {/* Progress Bar & Status Message */}
                    <div className="space-y-1.5">
                      <div className="w-full h-2 bg-muted-foreground/20 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            item.status === "completed"
                              ? "bg-emerald-500"
                              : item.status === "error"
                              ? "bg-destructive"
                              : "bg-primary"
                          }`}
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span
                          className={`font-medium ${
                            item.status === "completed"
                              ? "text-emerald-500"
                              : item.status === "error"
                              ? "text-destructive"
                              : item.status === "uploading"
                              ? "text-primary animate-pulse"
                              : "text-muted-foreground"
                          }`}
                        >
                          {item.status === "completed" && "Upload completed"}
                          {item.status === "error" && (item.error || "Upload error")}
                          {item.status === "uploading" && `Uploading (${item.progress}%)`}
                          {item.status === "pending" && "Queued"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status / Remove Action */}
                  <div className="shrink-0 flex items-center">
                    {item.status === "completed" ? (
                      <div className="h-8 w-8 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                        <Check className="h-4 w-4" />
                      </div>
                    ) : item.status === "uploading" ? (
                      <div className="h-8 w-8 text-primary flex items-center justify-center">
                        <Loader2 className="h-5 w-5 animate-spin" />
                      </div>
                    ) : item.status === "error" ? (
                      <div className="h-8 w-8 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
                        <AlertCircle className="h-4 w-4" />
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => removeFile(item.id)}
                        disabled={isUploading}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-4 border-t gap-4">
          <Button
            variant="outline"
            onClick={() => setFiles([])}
            disabled={isUploading || files.length === 0}
            className="text-muted-foreground"
          >
            Clear List
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isUploading}>
              {files.every((f) => f.status === "completed") && files.length > 0 ? "Done" : "Cancel"}
            </Button>
            <Button
              onClick={uploadAll}
              disabled={isUploading || pendingCount === 0}
              className="min-w-[120px]"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Uploading...
                </>
              ) : (
                `Start Upload (${pendingCount})`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
