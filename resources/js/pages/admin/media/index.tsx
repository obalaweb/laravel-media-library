import { router, Head } from "@inertiajs/react";
import { Upload, Search, Grid, List, MoreVertical, Trash2, Download, Copy, Image as ImageIcon, FileText, Film } from "lucide-react";
import { useState, useRef } from "react";
import { ActionModal } from "../../../components/action-modal";
import { Button } from "../../../components/ui/button";
import { Card, CardContent } from "../../../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "../../../components/ui/dropdown-menu";
import { Input } from "../../../components/ui/input";
import { useActionModal } from "../../../hooks/use-action-modal";
import { useToast } from "../../../hooks/use-toast";
import AppLayout from "@/layouts/app-layout";

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

interface MediaIndexProps {
  media: {
    data: MediaItem[];
    meta?: any;
    links?: any;
  };
  filters: {
    search?: string;
    type?: string;
  };
}

const breadcrumbs = [
    {
        title: 'Media Library',
        href: '/builder/media',
    },
];

export default function MediaIndex({ media, filters }: MediaIndexProps) {
  const { toast } = useToast();
  const { isOpen, openModal, closeModal, modalProps } = useActionModal();
  const [searchQuery, setSearchQuery] = useState(filters?.search || "");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [filterType, setFilterType] = useState(filters?.type || "all");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredMedia = media?.data || [];

  const handleUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    router.post('/builder/media', formData, {
      preserveScroll: true,
      forceFormData: true,
      onSuccess: () => {
        toast({ title: "File uploaded", description: "The file has been uploaded successfully." });
      },
      onError: (errors: any) => {
        toast({
          title: "Upload failed",
          description: errors.file || "Failed to upload file.",
          variant: "destructive"
        });
      },
    });
  };

  const handleDelete = (id: number) => {
    openModal({
      title: "Delete File",
      description: "Are you sure you want to delete this file? This action cannot be undone.",
      confirmText: "Delete",
      onConfirm: () => {
        router.delete(`/builder/media/${id}`, {
          preserveScroll: true,
          onSuccess: () => {
            toast({ title: "File deleted", description: "The file has been removed." });
          },
        });
      },
    });
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({ title: "URL copied", description: "Link copied to clipboard." });
  };

  const handleDownload = (url: string, fileName: string) => {
    try {
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || 'download';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({ title: "Download started", description: "File download has started." });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Unable to download file. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSearch = () => {
    router.get('/builder/media', {
      search: searchQuery || undefined,
      type: filterType !== "all" ? filterType : undefined,
    }, {
      preserveState: true,
      preserveScroll: true,
    });
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "image": return <ImageIcon className="h-8 w-8 text-primary" />;
      case "document": return <FileText className="h-8 w-8 text-orange-500" />;
      case "video": return <Film className="h-8 w-8 text-purple-500" />;
      default: return <FileText className="h-8 w-8 text-muted-foreground" />;
    }
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Media Library" />
      <ActionModal {...modalProps} />
      <div className="space-y-6 flex-1 p-4 md:p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Media Library</h1>
            <p className="text-muted-foreground mt-1">Manage your uploaded files</p>
          </div>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileChange}
              accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
            />
            <Button onClick={handleUpload}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Files
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="relative flex-1 w-full sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-9"
                />
              </div>
              <div className="flex items-center gap-2">
                <div className="flex border rounded-lg overflow-hidden">
                  {(["all", "image", "document", "video"]).map((type) => (
                    <Button
                      key={type}
                      variant={filterType === type ? "default" : "ghost"}
                      size="sm"
                      onClick={() => {
                        setFilterType(type);
                        router.get('/builder/media', {
                          search: searchQuery || undefined,
                          type: type !== "all" ? type : undefined,
                        }, {
                          preserveState: true,
                          preserveScroll: true,
                        });
                      }}
                      className="rounded-none capitalize py-0"
                    >
                      {type}
                    </Button>
                  ))}
                </div>
                <div className="flex border rounded-lg overflow-hidden">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="icon"
                    onClick={() => setViewMode("grid")}
                    className="rounded-none"
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="icon"
                    onClick={() => setViewMode("list")}
                    className="rounded-none"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {filteredMedia.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-lg bg-muted/50">
            <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-xl font-medium text-foreground">No files found</p>
            <p className="text-muted-foreground mb-4">You haven't uploaded any media files yet.</p>
            <Button onClick={handleUpload}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Files
            </Button>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredMedia.map((item) => (
              <Card
                key={item.id}
                className="group cursor-pointer hover:shadow-lg transition-all"
                onClick={() => setSelectedMedia(item)}
              >
                <CardContent className="p-0">
                  <div className="aspect-square relative bg-muted rounded-t-lg overflow-hidden">
                    {item.type === "image" ? (
                      <img src={item.url} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        {getIcon(item.type)}
                      </div>
                    )}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="secondary" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover text-popover-foreground">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleCopyUrl(item.url); }}>
                            <Copy className="h-4 w-4 mr-2" /> Copy URL
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDownload(item.url, item.original_name || item.name); }}>
                            <Download className="h-4 w-4 mr-2" /> Download
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium truncate">{item.name || item.original_name}</p>
                    <p className="text-xs text-muted-foreground">{item.formatted_size || `${(item.size / 1024 / 1024).toFixed(2)} MB`}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {filteredMedia.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 p-4 hover:bg-muted/50 cursor-pointer"
                    onClick={() => setSelectedMedia(item)}
                  >
                    <div className="h-12 w-12 rounded bg-muted flex items-center justify-center overflow-hidden">
                      {item.type === "image" ? (
                        <img src={item.url} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        getIcon(item.type)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.name || item.original_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.formatted_size || `${(item.size / 1024 / 1024).toFixed(2)} MB`}
                        {item.created_at && ` • ${new Date(item.created_at).toLocaleDateString()}`}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover text-popover-foreground">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleCopyUrl(item.url); }}>
                          <Copy className="h-4 w-4 mr-2" /> Copy URL
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDownload(item.url, item.original_name || item.name); }}>
                          <Download className="h-4 w-4 mr-2" /> Download
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Dialog open={!!selectedMedia} onOpenChange={() => setSelectedMedia(null)}>
          <DialogContent className="max-w-2xl bg-popover text-popover-foreground">
            <DialogHeader>
              <DialogTitle>{selectedMedia?.name}</DialogTitle>
            </DialogHeader>
            {selectedMedia && (
              <div className="space-y-4">
                {selectedMedia.type === "image" ? (
                  <img src={selectedMedia.url} alt={selectedMedia.name} className="w-full rounded-lg" loading="lazy" />
                ) : (
                  <div className="h-48 bg-muted rounded-lg flex items-center justify-center">
                    {getIcon(selectedMedia.type)}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">File size</p>
                    <p className="font-medium">{selectedMedia.formatted_size || `${(selectedMedia.size / 1024 / 1024).toFixed(2)} MB`}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Uploaded</p>
                    <p className="font-medium">{selectedMedia.created_at ? new Date(selectedMedia.created_at).toLocaleDateString() : 'N/A'}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => handleCopyUrl(selectedMedia.url)}>
                    <Copy className="h-4 w-4 mr-2" /> Copy URL
                  </Button>
                  <Button variant="outline" onClick={() => handleDownload(selectedMedia.url, selectedMedia.original_name || selectedMedia.name)}>
                    <Download className="h-4 w-4 mr-2" /> Download
                  </Button>
                  <Button variant="destructive" onClick={() => { handleDelete(selectedMedia.id); setSelectedMedia(null); }}>
                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
