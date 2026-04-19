import axios from "axios";
import { Search, Grid, List, Image as ImageIcon, Check, Upload, FileText, Video } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { useToast } from "../hooks/use-toast";

interface MediaItem {
  id: number;
  name: string;
  original_name: string;
  url: string;
  type: string;
  formatted_size: string;
  size: number;
  created_at?: string;
}

interface MediaSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (id: number, url: string, original_name?: string) => void;
  currentValue?: number | string | null;
  mediaType?: "image" | "document" | "video" | "all";
}

const MediaSelector = ({ open, onOpenChange, onSelect, currentValue, mediaType = "image" }: MediaSelectorProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedItem, setSelectedItem] = useState<number | null>(null);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const fetchMedia = useCallback(() => {
    setLoading(true);
    axios.get('/builder/media', {
      params: mediaType === "all" ? {} : { type: mediaType },
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'Accept': 'application/json',
      },
    })
    .then((response) => {
      let mediaData: MediaItem[] = [];
      if (response.data?.media?.data) {
        mediaData = response.data.media.data;
      } else if (Array.isArray(response.data?.media)) {
        mediaData = response.data.media;
      } else if (Array.isArray(response.data?.data)) {
        mediaData = response.data.data;
      } else if (Array.isArray(response.data)) {
        mediaData = response.data;
      }
      setMedia(mediaData);
      setLoading(false);
    })
    .catch((error) => {
      console.error('Error fetching media:', error);
      setMedia([]);
      setLoading(false);
    });
  }, [mediaType]);

  useEffect(() => {
    if (open) {
      fetchMedia();
    } else {
      setSearchQuery("");
      setSelectedItem(null);
    }
  }, [open, fetchMedia]);

  const items = mediaType === "all" ? media : media.filter((item) => item.type === mediaType);

  const filteredItems = items.filter((item) =>
    !searchQuery ||
    item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.original_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = () => {
    if (selectedItem) {
      const item = items.find((itm) => itm.id === selectedItem);
      if (item) {
        onSelect(item.id, item.url, item.original_name);
        onOpenChange(false);
        setSelectedItem(null);
        setSearchQuery("");
      }
    }
  };

  const handleItemClick = (id: number) => {
    setSelectedItem(selectedItem === id ? null : id);
  };

  const handleUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    let isValid = true;
    if (mediaType === "image") {
      isValid = file.type.startsWith('image/');
    } else if (mediaType === "document") {
      isValid = !file.type.startsWith('image/') && !file.type.startsWith('video/');
    } else if (mediaType === "video") {
      isValid = file.type.startsWith('video/');
    }

    if (!isValid) {
      toast({
        title: "Invalid file type",
        description: `Please select a valid ${mediaType} file.`,
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    axios.post('/builder/media', formData, {
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'Accept': 'application/json',
        'Content-Type': 'multipart/form-data',
      },
    })
    .then((response) => {
      if (response.data?.media) {
        toast({
          title: "File uploaded",
          description: "The file has been uploaded successfully."
        });
        fetchMedia();
        if (response.data.media.id) {
          setSelectedItem(response.data.media.id);
        }
      }
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    })
    .catch((error) => {
      const errorMessage = error.response?.data?.message || error.message || "Failed to upload file.";
      toast({
        title: "Upload failed",
        description: errorMessage,
        variant: "destructive"
      });
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Select {mediaType === "all" ? "File" : mediaType.charAt(0).toUpperCase() + mediaType.slice(1)}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 flex-1 overflow-hidden">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={`Search ${mediaType === "all" ? "files" : mediaType + 's'}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileChange}
                accept={mediaType === "image" ? "image/*" : mediaType === "video" ? "video/*" : mediaType === "document" ? ".pdf,.doc,.docx,.xls,.xlsx,.txt" : "*"}
              />
              <Button
                variant="outline"
                onClick={handleUpload}
                disabled={uploading}
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? "Uploading..." : "Upload"}
              </Button>
              <div className="flex border rounded-lg overflow-hidden">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("grid")}
                  className="rounded-none border-0 shadow-none"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("list")}
                  className="rounded-none border-0 shadow-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <ImageIcon className="h-12 w-12 text-muted-foreground mb-4 animate-pulse" />
                <p className="text-muted-foreground">Loading files...</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                {mediaType === "image" || mediaType === "all" ? (
                  <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
                ) : (
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                )}
                <p className="text-muted-foreground mb-4">
                  {searchQuery ? "No files found matching your search" : "No files found"}
                </p>
                <Button
                  variant="outline"
                  onClick={handleUpload}
                  disabled={uploading}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploading ? "Uploading..." : `Upload ${mediaType === "all" ? "File" : mediaType.charAt(0).toUpperCase() + mediaType.slice(1)}`}
                </Button>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredItems.map((item) => {
                  const isSelected = selectedItem === item.id;
                  const isCurrent = currentValue === item.id || currentValue === item.url;

                  return (
                    <Card
                      key={item.id}
                      className={`group cursor-pointer hover:shadow-lg transition-all relative ${
                        isSelected || isCurrent ? "ring-2 ring-primary" : ""
                      }`}
                      onClick={() => handleItemClick(item.id)}
                    >
                      <CardContent className="p-0">
                        <div className="aspect-square relative bg-muted rounded-t-lg overflow-hidden">
                          {item.type === 'image' ? (
                            <img
                              src={item.url}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : item.type === 'video' ? (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-muted text-muted-foreground">
                              <Video className="h-12 w-12 mb-2" />
                              <span className="text-xs uppercase font-medium">Video</span>
                            </div>
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-muted text-muted-foreground overflow-hidden">
                              <FileText className="h-12 w-12 mb-2" />
                              <span className="text-xs uppercase font-medium truncate max-w-[80%] px-2 text-center">{item.url.split('.').pop() || 'Document'}</span>
                            </div>
                          )}
                          {(isSelected || isCurrent) && (
                            <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                              <div className="bg-primary text-primary-foreground rounded-full p-2">
                                <Check className="h-5 w-5" />
                              </div>
                            </div>
                          )}
                          {isCurrent && (
                            <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                              Current
                            </div>
                          )}
                        </div>
                        <div className="p-3">
                          <p className="text-sm font-medium truncate">{item.name || item.original_name}</p>
                          <p className="text-xs text-muted-foreground">{item.formatted_size || `${(item.size / 1024 / 1024).toFixed(2)} MB`}</p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredItems.map((item) => {
                  const isSelected = selectedItem === item.id;
                  const isCurrent = currentValue === item.id || currentValue === item.url;

                  return (
                    <Card
                      key={item.id}
                      className={`cursor-pointer hover:bg-muted/50 transition-colors ${
                        isSelected || isCurrent ? "ring-2 ring-primary" : ""
                      }`}
                      onClick={() => handleItemClick(item.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="relative h-16 w-16 rounded bg-muted overflow-hidden flex-shrink-0">
                            {item.type === 'image' ? (
                              <img
                                src={item.url}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            ) : item.type === 'video' ? (
                              <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground">
                                <Video className="h-8 w-8" />
                              </div>
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground">
                                <FileText className="h-8 w-8" />
                              </div>
                            )}
                            {(isSelected || isCurrent) && (
                              <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                <Check className="h-5 w-5 text-primary" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium truncate">{item.name || item.original_name}</p>
                              {isCurrent && (
                                <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">
                                  Current
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {item.formatted_size || `${(item.size / 1024 / 1024).toFixed(2)} MB`}
                              {item.created_at && ` • ${new Date(item.created_at).toLocaleDateString()}`}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              {filteredItems.length} file{filteredItems.length !== 1 ? "s" : ""} found
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSelect} disabled={!selectedItem}>
                Select {mediaType === "all" ? "File" : mediaType.charAt(0).toUpperCase() + mediaType.slice(1)}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MediaSelector;
