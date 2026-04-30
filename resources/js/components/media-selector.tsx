import axios from "axios";
import { Search, Grid, List, Image as ImageIcon, Check, Upload, FileText, Video, Film, FolderUp } from "lucide-react";
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
  thumbnail_url?: string | null;
  medium_url?: string | null;
  large_url?: string | null;
  webp_url?: string | null;
}

interface MediaSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (id: number, url: string, original_name?: string) => void;
  onSelectMultiple?: (items: Array<{ id: number; url: string; original_name?: string }>) => void;
  currentValue?: number | string | Array<number | string> | null;
  mediaType?: "image" | "document" | "video" | "all";
  multiple?: boolean;
}

interface DrivePreviewFile {
  id: string;
  name: string;
  mime_type: string;
  size: number | null;
  already_imported: boolean;
  is_allowed?: boolean;
  thumbnail_link?: string;
}

interface DrivePreviewResponse {
  type: string;
  id: string;
  files: DrivePreviewFile[];
}

function MediaPreviewImage({ item, className }: { item: MediaItem; className: string }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const lowQualitySrc = item.thumbnail_url || item.url;
  const optimizedSrc = item.medium_url || item.webp_url || item.url;

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div className={`absolute inset-0 bg-muted animate-pulse transition-opacity duration-300 ${isLoaded ? "opacity-0" : "opacity-100"}`} />
      <img
        src={lowQualitySrc}
        alt={`${item.name} preview`}
        className={`absolute inset-0 w-full h-full object-cover scale-110 blur-xl transition-opacity duration-300 ${isLoaded ? "opacity-0" : "opacity-100"}`}
        loading="lazy"
      />
      <img
        src={optimizedSrc}
        alt={item.name}
        className={`relative w-full h-full object-cover transition-opacity duration-300 ${isLoaded ? "opacity-100" : "opacity-0"}`}
        onLoad={() => setIsLoaded(true)}
        loading="lazy"
      />
    </div>
  );
}

function getVisiblePages(currentPage: number, lastPage: number): number[] {
  const pages = new Set<number>([1, lastPage, currentPage - 1, currentPage, currentPage + 1]);

  if (currentPage <= 3) {
    pages.add(2);
    pages.add(3);
  }

  if (currentPage >= lastPage - 2) {
    pages.add(lastPage - 1);
    pages.add(lastPage - 2);
  }

  return [...pages]
    .filter((page) => page >= 1 && page <= lastPage)
    .sort((a, b) => a - b);
}

const MediaSelector = ({ open, onOpenChange, onSelect, onSelectMultiple, currentValue, mediaType = "image", multiple = false }: MediaSelectorProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedItem, setSelectedItem] = useState<number | null>(null);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [driveUrl, setDriveUrl] = useState("");
  const [drivePreview, setDrivePreview] = useState<DrivePreviewResponse | null>(null);
  const [selectedDriveIds, setSelectedDriveIds] = useState<string[]>([]);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [batchStatus, setBatchStatus] = useState<any>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { toast } = useToast();

  const fetchMedia = useCallback((page = 1) => {
    setLoading(true);
    axios.get('/builder/media', {
      params: {
        type: mediaType === "all" ? undefined : mediaType,
        search: searchQuery || undefined,
        page: page
      },
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'Accept': 'application/json',
      },
    })
    .then((response) => {
      let mediaData: MediaItem[] = [];
      let meta = null;
      
      if (response.data?.media?.data) {
        mediaData = response.data.media.data;
        meta = response.data.media.meta || response.data.media;
      } else if (Array.isArray(response.data?.media)) {
        mediaData = response.data.media;
        meta = response.data.pagination || null;
      } else if (Array.isArray(response.data?.data)) {
        mediaData = response.data.data;
        meta = response.data.meta;
      } else if (Array.isArray(response.data)) {
        mediaData = response.data;
      }
      
      setMedia(mediaData);
      setPagination(meta);
      if (meta?.current_page) setCurrentPage(meta.current_page);
      setLoading(false);
    })
    .catch((error) => {
      console.error('Error fetching media:', error);
      setMedia([]);
      setLoading(false);
    });
  }, [mediaType, searchQuery]);

  useEffect(() => {
    if (open) {
      fetchMedia(1);
    } else {
      setSearchQuery("");
      setSelectedItem(null);
      setSelectedItems([]);
      setCurrentPage(1);
    }
  }, [open, fetchMedia]);

  const currentValues = Array.isArray(currentValue) ? currentValue : [currentValue];

  const handleSelect = () => {
    if (multiple) {
      if (selectedItems.length === 0) {
        return;
      }

      const selectedMediaItems = media
        .filter((item) => selectedItems.includes(item.id))
        .map((item) => ({ id: item.id, url: item.url, original_name: item.original_name }));

      if (onSelectMultiple) {
        onSelectMultiple(selectedMediaItems);
      } else if (selectedMediaItems.length > 0) {
        onSelect(selectedMediaItems[0].id, selectedMediaItems[0].url, selectedMediaItems[0].original_name);
      }

      onOpenChange(false);
      setSelectedItems([]);
      setSearchQuery("");

      return;
    }

    if (selectedItem) {
      const item = media.find((itm) => itm.id === selectedItem);
      if (item) {
        onSelect(item.id, item.url, item.original_name);
        onOpenChange(false);
        setSelectedItem(null);
        setSearchQuery("");
      }
    }
  };

  const handleItemClick = (id: number) => {
    if (multiple) {
      setSelectedItems((current) => (
        current.includes(id) ? current.filter((itemId) => itemId !== id) : [...current, id]
      ));
      return;
    }

    setSelectedItem(selectedItem === id ? null : id);
  };

  const handleUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from<File>(e.target.files ?? []);
    if (files.length === 0) return;

    for (const file of files) {
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
          description: `Please select valid ${mediaType} files.`,
          variant: "destructive"
        });
        return;
      }
    }

    setUploading(true);
    const formData = new FormData();
    files.forEach((file) => formData.append('files[]', file));

    axios.post('/builder/media', formData, {
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'Accept': 'application/json',
        'Content-Type': 'multipart/form-data',
      },
    })
    .then((response) => {
      if (response.data?.media_items || response.data?.media) {
        toast({
          title: files.length > 1 ? "Files uploaded" : "File uploaded",
          description: files.length > 1
            ? `${files.length} files have been uploaded successfully.`
            : "The file has been uploaded successfully."
        });
        fetchMedia(1);
        if (multiple) {
          const ids = (response.data?.media_items?.data ?? [])
            .map((item: MediaItem) => item.id)
            .filter(Boolean);
          setSelectedItems(ids);
        } else if (response.data?.media?.id) {
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

  const csrfToken = () => document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';

  const previewGoogleDrive = async () => {
    if (!driveUrl.trim()) {
      toast({ title: "Link required", description: "Paste a Google Drive file or folder link.", variant: "destructive" });
      return;
    }

    try {
      setIsPreviewLoading(true);
      setDrivePreview(null);
      setBatchStatus(null);

      const response = await fetch('/builder/media/imports/google-drive/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRF-TOKEN': csrfToken(),
        },
        body: JSON.stringify({ url: driveUrl.trim() }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.message ?? 'Unable to preview this Drive link.');
      }

      setDrivePreview(payload.data);
      const selectableIds = (payload.data?.files ?? [])
        .filter((file: DrivePreviewFile) => !file.already_imported && file.is_allowed !== false)
        .map((file: DrivePreviewFile) => file.id);
      setSelectedDriveIds(selectableIds);
    } catch (error: any) {
      toast({
        title: "Preview failed",
        description: error?.message ?? "Could not fetch files from Google Drive.",
        variant: "destructive",
      });
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const startGoogleDriveImport = async () => {
    if (!driveUrl.trim()) return;

    try {
      setIsImporting(true);

      const response = await fetch('/builder/media/imports/google-drive/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRF-TOKEN': csrfToken(),
        },
        body: JSON.stringify({
          url: driveUrl.trim(),
          selected_file_ids: selectedDriveIds,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.message ?? 'Unable to start import.');
      }

      setBatchStatus(payload.batch);
      toast({ title: "Import started", description: "Google Drive files are now importing in the background." });

      const batchId = payload.batch?.id;
      if (!batchId) return;

      if (pollRef.current) {
        clearInterval(pollRef.current);
      }

      pollRef.current = setInterval(async () => {
        const statusResponse = await fetch(`/builder/media/imports/${batchId}`, {
          headers: { 'Accept': 'application/json' },
        });
        const statusPayload = await statusResponse.json();
        if (!statusResponse.ok) return;

        setBatchStatus(statusPayload.batch);

        if (["completed", "completed_with_errors"].includes(statusPayload.batch?.status)) {
          if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
          }
          fetchMedia(1);
        }
      }, 2500);
    } catch (error: any) {
      toast({
        title: "Import failed to start",
        description: error?.message ?? "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  useEffect(() => {
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
      }
    };
  }, []);

  const lastPage = pagination?.last_page || 1;
  const hasMultiplePages = lastPage > 1 || Boolean(pagination?.next_page_url) || currentPage > 1;
  const pageNumbers = getVisiblePages(currentPage, lastPage);

  return (
    <>
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
                  onKeyDown={(e) => e.key === 'Enter' && fetchMedia(1)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                  multiple
                  accept={mediaType === "image" ? "image/*" : mediaType === "video" ? "video/*" : mediaType === "document" ? ".pdf,.doc,.docx,.xls,.xlsx,.txt" : "*"}
                />
                <Button variant="outline" onClick={() => setIsDriveModalOpen(true)}>
                  <FolderUp className="h-4 w-4 mr-2" />
                  Drive
                </Button>
                <Button
                  variant="outline"
                  onClick={handleUpload}
                  disabled={uploading}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploading ? "..." : "Upload"}
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

            <div className="flex-1 overflow-y-auto min-h-0">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <ImageIcon className="h-12 w-12 text-muted-foreground mb-4 animate-pulse" />
                  <p className="text-muted-foreground">Loading files...</p>
                </div>
              ) : media.length === 0 ? (
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
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-4">
                  {media.map((item) => {
                    const isSelected = selectedItem === item.id;
                    const isMultiSelected = selectedItems.includes(item.id);
                    const isCurrent = currentValues.includes(item.id) || currentValues.includes(item.url);

                    return (
                      <Card
                        key={item.id}
                        className={`group cursor-pointer hover:shadow-lg transition-all relative ${
                          isSelected || isCurrent || isMultiSelected ? "ring-2 ring-primary" : ""
                        }`}
                        onClick={() => handleItemClick(item.id)}
                      >
                        <CardContent className="p-0">
                          <div className="aspect-square relative bg-muted rounded-t-lg overflow-hidden">
                            {item.type === 'image' ? (
                              <MediaPreviewImage item={item} className="w-full h-full" />
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
                            {(isSelected || isCurrent || isMultiSelected) && (
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
                <div className="space-y-2 pb-4">
                  {media.map((item) => {
                    const isSelected = selectedItem === item.id;
                    const isMultiSelected = selectedItems.includes(item.id);
                    const isCurrent = currentValues.includes(item.id) || currentValues.includes(item.url);

                    return (
                      <Card
                        key={item.id}
                        className={`cursor-pointer hover:bg-muted/50 transition-colors ${
                          isSelected || isCurrent || isMultiSelected ? "ring-2 ring-primary" : ""
                        }`}
                        onClick={() => handleItemClick(item.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <div className="relative h-16 w-16 rounded bg-muted overflow-hidden flex-shrink-0">
                              {item.type === 'image' ? (
                                <MediaPreviewImage item={item} className="w-full h-full" />
                              ) : item.type === 'video' ? (
                                <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground">
                                  <Video className="h-8 w-8" />
                                </div>
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground">
                                  <FileText className="h-8 w-8" />
                                </div>
                              )}
                              {(isSelected || isCurrent || isMultiSelected) && (
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

            <div className="flex flex-col gap-4 pt-4 border-t">
              {hasMultiplePages && (
                <div className="flex items-center justify-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchMedia(currentPage - 1)}
                    disabled={currentPage <= 1}
                  >
                    Prev
                  </Button>
                  {pageNumbers.map((page, index) => {
                    const previous = pageNumbers[index - 1];
                    const showGap = previous && page - previous > 1;

                    return (
                      <div key={page} className="flex items-center gap-1">
                        {showGap && <span className="text-muted-foreground text-xs">...</span>}
                        <Button
                          variant={page === currentPage ? "default" : "outline"}
                          size="sm"
                          onClick={() => fetchMedia(page)}
                          className="h-8 w-8 p-0"
                        >
                          {page}
                        </Button>
                      </div>
                    );
                  })}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchMedia(currentPage + 1)}
                    disabled={currentPage >= lastPage}
                  >
                    Next
                  </Button>
                </div>
              )}
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {pagination?.total || media.length} files found
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSelect} disabled={multiple ? selectedItems.length === 0 : !selectedItem}>
                    {multiple ? `Select ${selectedItems.length}` : `Select File`}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isDriveModalOpen} onOpenChange={(open) => {
        setIsDriveModalOpen(open);
        if (!open && pollRef.current) {
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
      }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Import from Google Drive</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Paste Google Drive folder or file link..."
                value={driveUrl}
                onChange={(e) => setDriveUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && previewGoogleDrive()}
              />
              <Button onClick={previewGoogleDrive} disabled={isPreviewLoading}>
                {isPreviewLoading ? "..." : "Preview"}
              </Button>
            </div>

            {drivePreview && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Found {drivePreview.files.length} files</p>
                  <Button variant="ghost" size="sm" onClick={() => {
                    const allIds = drivePreview.files
                      .filter(f => !f.already_imported && f.is_allowed !== false)
                      .map(f => f.id);
                    setSelectedDriveIds(selectedDriveIds.length === allIds.length ? [] : allIds);
                  }}>
                    {selectedDriveIds.length === drivePreview.files.filter(f => !f.already_imported && f.is_allowed !== false).length ? "Deselect All" : "Select All"}
                  </Button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[40vh] overflow-y-auto p-1">
                  {drivePreview.files.map((file) => (
                    <div
                      key={file.id}
                      onClick={() => !file.already_imported && file.is_allowed !== false && setSelectedDriveIds(curr => curr.includes(file.id) ? curr.filter(id => id !== file.id) : [...curr, file.id])}
                      className={`relative aspect-square rounded-lg border-2 overflow-hidden cursor-pointer transition-all ${
                        selectedDriveIds.includes(file.id) ? "border-primary ring-2 ring-primary/20" : "border-transparent hover:border-muted-foreground/20"
                      } ${file.already_imported || file.is_allowed === false ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      {file.thumbnail_link ? (
                        <img src={file.thumbnail_link} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-muted">
                          {file.mime_type.includes('video') ? <Film className="h-8 w-8" /> : <FileText className="h-8 w-8" />}
                        </div>
                      )}
                      <div className="absolute inset-x-0 bottom-0 bg-black/60 p-1.5">
                        <p className="text-[10px] text-white truncate leading-tight">{file.name}</p>
                      </div>
                      {file.already_imported && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <Check className="h-6 w-6 text-white" />
                        </div>
                      )}
                      {selectedDriveIds.includes(file.id) && (
                        <div className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full p-0.5">
                          <Check className="h-3 w-3" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-2">
                  <Button 
                    className="w-full" 
                    onClick={startGoogleDriveImport} 
                    disabled={isImporting || selectedDriveIds.length === 0}
                  >
                    {isImporting ? "Starting..." : `Import ${selectedDriveIds.length} Selected Files`}
                  </Button>
                  
                  {batchStatus && (
                    <div className="p-3 rounded-lg bg-muted space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium capitalize">Status: {batchStatus.status.replace('_', ' ')}</span>
                        <span>{batchStatus.imported_count} / {batchStatus.total_count} imported</span>
                      </div>
                      <div className="w-full h-1.5 bg-background rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all duration-500" 
                          style={{ width: `${(batchStatus.imported_count / batchStatus.total_count) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MediaSelector;
