import { useRef } from "react";
import { Camera, Upload } from "lucide-react";
import { Button } from "./ui/button";
import { toast } from "sonner";

interface PhotoUploadButtonProps {
  onUpload?: (files: FileList) => void;
  variant?: "button" | "icon";
  className?: string;
}

export function PhotoUploadButton({ onUpload, variant = "button", className }: PhotoUploadButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      // Validate file types
      const validTypes = ["image/jpeg", "image/png", "image/jpg", "image/heic"];
      const invalidFiles = Array.from(files).filter(file => !validTypes.includes(file.type));
      
      if (invalidFiles.length > 0) {
        toast.error("Please upload only image files (JPEG, PNG, HEIC)");
        return;
      }

      // Validate file sizes (max 10MB each)
      const oversizedFiles = Array.from(files).filter(file => file.size > 10 * 1024 * 1024);
      
      if (oversizedFiles.length > 0) {
        toast.error("Each image must be less than 10MB");
        return;
      }

      onUpload?.(files);
      toast.success(`${files.length} photo${files.length > 1 ? "s" : ""} uploaded`);
      
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  if (variant === "icon") {
    return (
      <>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClick}
          className={className}
        >
          <Camera className="h-5 w-5" />
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
      </>
    );
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={handleClick}
        className={`gap-2 ${className || ""}`}
      >
        <Upload className="h-4 w-4" />
        Upload Photos
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
    </>
  );
}
