import { useState, useRef, TouchEvent, WheelEvent } from "react";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "./ui/button";

interface Photo {
  id: number;
  url: string;
  caption: string;
  timestamp: string;
}

interface PhotoViewerProps {
  photos: Photo[];
  initialIndex: number;
  onClose: () => void;
}

export default function PhotoViewer({ photos, initialIndex, onClose }: PhotoViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [touchStart, setTouchStart] = useState({ x: 0, y: 0, distance: 0 });
  const imageRef = useRef<HTMLDivElement>(null);

  const currentPhoto = photos[currentIndex];

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      resetZoom();
    }
  };

  const handleNext = () => {
    if (currentIndex < photos.length - 1) {
      setCurrentIndex(currentIndex + 1);
      resetZoom();
    }
  };

  const resetZoom = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.5, 4));
  };

  const handleZoomOut = () => {
    if (zoom <= 1) {
      resetZoom();
    } else {
      setZoom((prev) => Math.max(prev - 0.5, 1));
    }
  };

  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  // Mouse drag for panning when zoomed
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch handling for pinch-to-zoom and swipe
  const handleTouchStart = (e: TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch to zoom
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      setTouchStart({
        x: (touch1.clientX + touch2.clientX) / 2,
        y: (touch1.clientY + touch2.clientY) / 2,
        distance,
      });
    } else if (e.touches.length === 1) {
      setTouchStart({
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        distance: 0,
      });
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch zoom
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      
      const scale = distance / touchStart.distance;
      setZoom((prev) => Math.min(Math.max(prev * scale, 1), 4));
      
      setTouchStart({
        x: (touch1.clientX + touch2.clientX) / 2,
        y: (touch1.clientY + touch2.clientY) / 2,
        distance,
      });
    } else if (e.touches.length === 1 && zoom > 1) {
      // Pan when zoomed
      const dx = e.touches[0].clientX - touchStart.x;
      const dy = e.touches[0].clientY - touchStart.y;
      setPosition((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
      setTouchStart({
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        distance: 0,
      });
    }
  };

  const handleTouchEnd = (e: TouchEvent) => {
    if (e.touches.length === 0 && zoom === 1) {
      // Swipe to change photos or close
      const dx = e.changedTouches[0].clientX - touchStart.x;
      const dy = e.changedTouches[0].clientY - touchStart.y;
      
      if (Math.abs(dy) > 100 && Math.abs(dy) > Math.abs(dx)) {
        // Vertical swipe to close
        onClose();
      } else if (Math.abs(dx) > 100) {
        // Horizontal swipe to change photos
        if (dx > 0 && currentIndex > 0) {
          handlePrevious();
        } else if (dx < 0 && currentIndex < photos.length - 1) {
          handleNext();
        }
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.95)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div>
          <p style={{ fontSize: "16px", color: "white", fontWeight: 600 }}>
            {currentPhoto.caption}
          </p>
          <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.7)" }}>
            {currentPhoto.timestamp} · {currentIndex + 1} of {photos.length}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleZoomOut}
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10"
            disabled={zoom <= 1}
          >
            <ZoomOut size={20} />
          </Button>
          <Button
            onClick={handleZoomIn}
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10"
            disabled={zoom >= 4}
          >
            <ZoomIn size={20} />
          </Button>
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10"
          >
            <X size={20} />
          </Button>
        </div>
      </div>

      {/* Photo */}
      <div className="flex-1 flex items-center justify-center overflow-hidden relative">
        {/* Previous button */}
        {currentIndex > 0 && (
          <Button
            onClick={handlePrevious}
            variant="ghost"
            size="icon"
            className="absolute left-4 z-10 w-12 h-12 rounded-full bg-black/50 text-white hover:bg-black/70"
          >
            <ChevronLeft size={24} />
          </Button>
        )}

        {/* Image container */}
        <div
          ref={imageRef}
          className="relative"
          style={{
            cursor: zoom > 1 ? (isDragging ? "grabbing" : "grab") : "default",
            transition: isDragging ? "none" : "transform 0.3s ease",
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <img
            src={currentPhoto.url}
            alt={currentPhoto.caption}
            className="max-w-[90vw] max-h-[80vh] object-contain select-none"
            style={{
              transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
              transition: isDragging ? "none" : "transform 0.3s ease",
            }}
            draggable={false}
          />
        </div>

        {/* Next button */}
        {currentIndex < photos.length - 1 && (
          <Button
            onClick={handleNext}
            variant="ghost"
            size="icon"
            className="absolute right-4 z-10 w-12 h-12 rounded-full bg-black/50 text-white hover:bg-black/70"
          >
            <ChevronRight size={24} />
          </Button>
        )}
      </div>

      {/* Footer - Thumbnails */}
      <div className="p-4 flex gap-2 justify-center overflow-x-auto">
        {photos.map((photo, index) => (
          <button
            key={photo.id}
            onClick={() => {
              setCurrentIndex(index);
              resetZoom();
            }}
            className="w-16 h-16 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0"
            style={{
              borderColor: index === currentIndex ? "white" : "transparent",
              opacity: index === currentIndex ? 1 : 0.6,
            }}
          >
            <img
              src={photo.url}
              alt={photo.caption}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>

      {/* Instructions */}
      <div
        className="absolute bottom-24 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-full"
        style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
      >
        <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.9)", whiteSpace: "nowrap" }}>
          Pinch to zoom • Swipe to navigate • Swipe down to close
        </p>
      </div>
    </div>
  );
}
