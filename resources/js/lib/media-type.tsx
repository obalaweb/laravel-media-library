import { Files, FileText, Image as ImageIcon, Video, type LucideProps } from "lucide-react";
import React from "react";
import { cn } from "./utils";

const TYPE_LABELS: Record<string, string> = {
  image: "Image",
  document: "Document",
  video: "Video",
};

export function mediaTypeLabel(type: string): string {
  return TYPE_LABELS[type] ?? type;
}

export function MediaTypeIcon({
  type,
  className,
  ...props
}: { type: string; className?: string } & LucideProps) {
  const iconClass = cn("shrink-0", className);
  switch (type) {
    case "image":
      return <ImageIcon className={iconClass} aria-hidden {...props} />;
    case "video":
      return <Video className={iconClass} aria-hidden {...props} />;
    case "document":
      return <FileText className={iconClass} aria-hidden {...props} />;
    default:
      return <FileText className={iconClass} aria-hidden {...props} />;
  }
}

export function MediaTypeFilterIcon({
  filterKey,
  className,
  ...props
}: { filterKey: string; className?: string } & LucideProps) {
  const iconClass = cn("shrink-0", className);
  switch (filterKey) {
    case "all":
      return <Files className={iconClass} aria-hidden {...props} />;
    case "image":
      return <ImageIcon className={iconClass} aria-hidden {...props} />;
    case "document":
      return <FileText className={iconClass} aria-hidden {...props} />;
    case "video":
      return <Video className={iconClass} aria-hidden {...props} />;
    default:
      return <Files className={iconClass} aria-hidden {...props} />;
  }
}

export function MediaTypeCornerBadge({
  type,
  className,
}: {
  type: string;
  className?: string;
}) {
  const label = mediaTypeLabel(type);

  return (
    <div
      className={cn(
        "pointer-events-none absolute bottom-2 left-2 z-[5] flex h-7 w-7 items-center justify-center rounded-full border border-border/70 bg-background/95 text-muted-foreground shadow-sm backdrop-blur-sm",
        className,
      )}
      title={label}
    >
      <MediaTypeIcon type={type} className="h-3.5 w-3.5" />
    </div>
  );
}
