import { Check, Grid, Image as ImageIcon, List, Search, Upload } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';

interface MediaItem {
    id: number;
    name: string;
    original_name: string;
    url: string;
    type: string;
    formatted_size: string;
}

interface MediaSelectorProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelect: (id: number, url: string) => void;
    currentValue?: number | null;
}

export default function MediaSelector({ open, onOpenChange, onSelect, currentValue }: MediaSelectorProps) {
    const [search, setSearch] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [media, setMedia] = useState<MediaItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchMedia = useCallback(() => {
        setLoading(true);
        fetch('/builder/media?type=image', {
            headers: { 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' },
        })
            .then((res) => res.json())
            .then((data) => {
                const items: MediaItem[] = data?.media?.data ?? data?.media ?? [];
                setMedia(items);
            })
            .catch(() => setMedia([]))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (open) {
            fetchMedia();
        } else {
            setSearch('');
            setSelectedId(null);
        }
    }, [open, fetchMedia]);

    const filtered = media.filter(
        (item) =>
            item.type === 'image' &&
            (!search || item.name?.toLowerCase().includes(search.toLowerCase()) || item.original_name?.toLowerCase().includes(search.toLowerCase())),
    );

    const handleConfirm = () => {
        if (!selectedId) return;
        const item = media.find((m) => m.id === selectedId);
        if (item) {
            onSelect(item.id, item.url);
            onOpenChange(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file.');
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';

        fetch('/builder/media', {
            method: 'POST',
            headers: { 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json', 'X-CSRF-TOKEN': csrfToken },
            body: formData,
        })
            .then((res) => res.json())
            .then((data) => {
                toast.success('Image uploaded.');
                fetchMedia();
                if (data?.media?.id) {
                    setSelectedId(data.media.id);
                }
            })
            .catch(() => toast.error('Upload failed.'))
            .finally(() => {
                setUploading(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
            });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[90vh] max-w-4xl flex-col">
                <DialogHeader>
                    <DialogTitle>Select Image</DialogTitle>
                </DialogHeader>

                <div className="flex flex-1 flex-col gap-4 overflow-hidden">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input placeholder="Search images..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
                        </div>
                        <div className="flex items-center gap-2">
                            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                            <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                                <Upload className="mr-2 size-4" />
                                {uploading ? 'Uploading…' : 'Upload'}
                            </Button>
                            <div className="flex overflow-hidden rounded-lg border">
                                <Button
                                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                                    size="icon"
                                    onClick={() => setViewMode('grid')}
                                    className="rounded-none border-0"
                                >
                                    <Grid className="size-4" />
                                </Button>
                                <Button
                                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                                    size="icon"
                                    onClick={() => setViewMode('list')}
                                    className="rounded-none border-0"
                                >
                                    <List className="size-4" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <ImageIcon className="mb-4 size-12 animate-pulse text-muted-foreground" />
                                <p className="text-muted-foreground">Loading…</p>
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <ImageIcon className="mb-4 size-12 text-muted-foreground" />
                                <p className="mb-4 text-muted-foreground">{search ? 'No images match your search.' : 'No images uploaded yet.'}</p>
                                <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                                    <Upload className="mr-2 size-4" />
                                    Upload Image
                                </Button>
                            </div>
                        ) : viewMode === 'grid' ? (
                            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                                {filtered.map((item) => {
                                    const isSelected = selectedId === item.id || currentValue === item.id;
                                    return (
                                        <div
                                            key={item.id}
                                            onClick={() => setSelectedId(item.id)}
                                            className={`relative cursor-pointer overflow-hidden rounded-lg border transition-all hover:shadow-md ${isSelected ? 'ring-2 ring-primary' : ''}`}
                                        >
                                            <div className="aspect-square bg-muted">
                                                <img src={item.url} alt={item.name} className="size-full object-cover" loading="lazy" />
                                            </div>
                                            {isSelected && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-primary/20">
                                                    <div className="rounded-full bg-primary p-1.5 text-primary-foreground">
                                                        <Check className="size-4" />
                                                    </div>
                                                </div>
                                            )}
                                            <div className="p-2">
                                                <p className="truncate text-xs font-medium">{item.name || item.original_name}</p>
                                                <p className="text-xs text-muted-foreground">{item.formatted_size}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {filtered.map((item) => {
                                    const isSelected = selectedId === item.id || currentValue === item.id;
                                    return (
                                        <div
                                            key={item.id}
                                            onClick={() => setSelectedId(item.id)}
                                            className={`flex cursor-pointer items-center gap-4 rounded-lg border p-3 transition-colors hover:bg-muted/50 ${isSelected ? 'ring-2 ring-primary' : ''}`}
                                        >
                                            <div className="size-12 flex-shrink-0 overflow-hidden rounded bg-muted">
                                                <img src={item.url} alt={item.name} className="size-full object-cover" loading="lazy" />
                                            </div>
                                            <div className="flex-1 overflow-hidden">
                                                <p className="truncate font-medium">{item.name || item.original_name}</p>
                                                <p className="text-sm text-muted-foreground">{item.formatted_size}</p>
                                            </div>
                                            {isSelected && <Check className="size-4 flex-shrink-0 text-primary" />}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-between border-t pt-4">
                        <p className="text-sm text-muted-foreground">
                            {filtered.length} image{filtered.length !== 1 ? 's' : ''}
                        </p>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => onOpenChange(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleConfirm} disabled={!selectedId}>
                                Select Image
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
