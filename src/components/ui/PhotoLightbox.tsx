import PhotoViewer from '@/components/PhotoViewer';

interface PhotoLightboxProps {
  photos: string[];
  initialIndex: number;
  category: string;
  isOpen: boolean;
  onClose: () => void;
}

export function PhotoLightbox({ photos, initialIndex, category, isOpen, onClose }: PhotoLightboxProps) {
  if (!isOpen) return null;

  const mappedPhotos = photos.map((url, i) => ({
    id: i,
    url,
    caption: category,
    timestamp: ''
  }));

  return (
    <PhotoViewer 
      photos={mappedPhotos} 
      initialIndex={initialIndex} 
      onClose={onClose} 
    />
  );
}
