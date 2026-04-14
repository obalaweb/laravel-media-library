import { Image as ImageIcon, Upload, X } from 'lucide-react';
import { useState } from 'react';
import MediaSelector from './media-selector';
import { Button } from './ui/button';

interface ImageUploadProps {
    value?: number | null;
    previewUrl?: string | null;
    onChange: (id: number | null, url: string | null) => void;
    label?: string;
}

export default function ImageUpload({ value, previewUrl, onChange, label }: ImageUploadProps) {
    const [selectorOpen, setSelectorOpen] = useState(false);

    const handleSelect = (id: number, url: string) => {
        onChange(id, url);
    };

    const handleRemove = () => {
        onChange(null, null);
    };

    return (
        <div className="space-y-2">
            {label && <p className="text-sm font-medium leading-none">{label}</p>}

            {previewUrl ? (
                <div className="group relative">
                    <div className="aspect-video w-full overflow-hidden rounded-lg border bg-muted">
                        <img src={previewUrl} alt="Service image" className="size-full object-cover" />
                    </div>
                    <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
                        <Button variant="destructive" size="icon" className="size-8" onClick={handleRemove} type="button">
                            <X className="size-4" />
                        </Button>
                    </div>
                </div>
            ) : (
                <div
                    onClick={() => setSelectorOpen(true)}
                    className="flex aspect-video w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed bg-muted/50 transition-colors hover:border-primary hover:bg-muted"
                >
                    <ImageIcon className="mb-2 size-10 text-muted-foreground" />
                    <p className="text-sm font-medium text-muted-foreground">Click to select image</p>
                    <p className="text-xs text-muted-foreground">Choose from media library</p>
                </div>
            )}

            <div className="flex gap-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setSelectorOpen(true)}>
                    <Upload className="mr-2 size-4" />
                    {value ? 'Change Image' : 'Select Image'}
                </Button>
                {value && (
                    <Button type="button" variant="outline" onClick={handleRemove}>
                        <X className="mr-2 size-4" />
                        Remove
                    </Button>
                )}
            </div>

            <MediaSelector open={selectorOpen} onOpenChange={setSelectorOpen} onSelect={handleSelect} currentValue={value} />
        </div>
    );
}
