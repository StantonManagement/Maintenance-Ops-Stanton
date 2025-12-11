import { ImageIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PhotoThumbnailGridProps {
  before: string[];
  after: string[];
  cleanup: string[];
  onPhotoClick: (url: string, category: string) => void;
}

export function PhotoThumbnailGrid({ before, after, cleanup, onPhotoClick }: PhotoThumbnailGridProps) {
  const categories = [
    { id: 'before', label: 'BEFORE', photos: before },
    { id: 'after', label: 'AFTER', photos: after },
    { id: 'cleanup', label: 'CLEANUP', photos: cleanup },
  ];

  return (
    <div className="grid grid-cols-3 gap-4">
      {categories.map((cat) => (
        <div key={cat.id} className="space-y-2">
          <div className="text-[10px] font-semibold text-muted-foreground tracking-wider">{cat.label}</div>
          <div 
            className="relative aspect-square bg-muted rounded-md overflow-hidden border cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => cat.photos.length > 0 && onPhotoClick(cat.photos[0], cat.id)}
          >
            {cat.photos.length > 0 ? (
              <>
                <img 
                  src={cat.photos[0]} 
                  alt={`${cat.label} photo`} 
                  className="w-full h-full object-cover" 
                  loading="lazy"
                />
                {cat.photos.length > 1 && (
                  <Badge 
                    className="absolute bottom-1 right-1 h-5 min-w-5 px-1 bg-black/70 hover:bg-black/80 text-white border-none"
                  >
                    +{cat.photos.length - 1}
                  </Badge>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground/50">
                <ImageIcon className="h-8 w-8 mb-1" />
                <span className="text-[10px]">No photos</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
