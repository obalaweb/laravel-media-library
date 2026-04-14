import { Head, router } from '@inertiajs/react';
import { FileText, Film, Image as ImageIcon, Search, Trash2, Upload } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import ConfirmModal from '../../../components/confirm-modal';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { useConfirm } from '../../../hooks/use-confirm';

type MediaItem = {
    id: number;
    name: string;
    original_name: string;
    url: string;
    type: string;
    formatted_size: string;
};

type MediaIndexProps = {
    media: {
        data: MediaItem[];
    };
    filters: {
        search?: string;
        type?: string;
    };
};

function TypeIcon({ type }: { type: string }) {
    if (type === 'image') {
        return <ImageIcon className="size-4" />;
    }

    if (type === 'video') {
        return <Film className="size-4" />;
    }

    return <FileText className="size-4" />;
}

export default function MediaIndex({ media, filters }: MediaIndexProps) {
    const { confirm, confirmModalProps } = useConfirm();
    const [search, setSearch] = useState(filters.search ?? '');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const rows = useMemo(() => media.data ?? [], [media.data]);

    const runSearch = (): void => {
        router.get('/builder/media', {
            search: search || undefined,
            type: filters.type || undefined,
        });
    };

    const uploadFile = (event: React.ChangeEvent<HTMLInputElement>): void => {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        router.post('/builder/media', formData, {
            forceFormData: true,
            preserveScroll: true,
        });
    };

    return (
        <>
            <Head title="Media Library" />
            <ConfirmModal {...confirmModalProps} />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-hidden rounded-xl p-3 sm:p-4">
                <div className="rounded-xl border border-sidebar-border/70 p-4 dark:border-sidebar-border">
                    <h1 className="text-2xl font-semibold">Media Library</h1>
                    <p className="text-sm text-muted-foreground">Upload and manage files used in admin content.</p>
                </div>

                <div className="flex flex-col gap-3 rounded-xl border border-sidebar-border/70 p-4 dark:border-sidebar-border md:flex-row md:items-center md:justify-between">
                    <div className="flex w-full flex-col gap-2 sm:max-w-md sm:flex-row">
                        <Input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                    runSearch();
                                }
                            }}
                            placeholder="Search media..."
                        />
                        <Button variant="outline" onClick={runSearch} className="w-full sm:w-auto">
                            <Search className="mr-2 size-4" />
                            Search
                        </Button>
                    </div>

                    <div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            onChange={uploadFile}
                            accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
                        />
                        <Button onClick={() => fileInputRef.current?.click()} className="w-full md:w-auto">
                            <Upload className="mr-2 size-4" />
                            Upload
                        </Button>
                    </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                    <table className="w-full min-w-[720px] text-left text-sm">
                        <thead className="bg-muted/40">
                            <tr>
                                <th className="px-4 py-3">Name</th>
                                <th className="px-4 py-3">Type</th>
                                <th className="hidden px-4 py-3 sm:table-cell">Size</th>
                                <th className="px-4 py-3">Preview</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.length === 0 ? (
                                <tr>
                                    <td className="px-4 py-8 text-center text-muted-foreground" colSpan={5}>
                                        No media files found.
                                    </td>
                                </tr>
                            ) : (
                                rows.map((item) => (
                                    <tr key={item.id} className="border-t border-sidebar-border/60 dark:border-sidebar-border">
                                        <td className="px-4 py-3">
                                            <div className="font-medium">{item.name}</div>
                                            <div className="text-xs text-muted-foreground">{item.original_name}</div>
                                        </td>
                                        <td className="px-4 py-3 capitalize">
                                            <span className="inline-flex items-center gap-2">
                                                <TypeIcon type={item.type} />
                                                {item.type}
                                            </span>
                                        </td>
                                        <td className="hidden px-4 py-3 sm:table-cell">{item.formatted_size}</td>
                                        <td className="px-4 py-3">
                                            <a href={item.url} target="_blank" rel="noreferrer" className="text-primary underline">
                                                Open file
                                            </a>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() =>
                                                    confirm({
                                                        title: 'Delete file?',
                                                        description: `"${item.name}" will be permanently deleted.`,
                                                        onConfirm: () => router.delete(`/builder/media/${item.id}`),
                                                    })
                                                }
                                            >
                                                <Trash2 className="mr-2 size-4" />
                                                Delete
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}

MediaIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/admin' },
        { title: 'Media', href: '/builder/media' },
    ],
};
