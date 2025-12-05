import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { useState, useEffect } from "react";
import { Loader2, Send, Edit } from "lucide-react";

interface PreSendPreviewModalProps {
  isOpen: boolean;
  recipient: string;
  content: string;
  triggerType: string;
  onSend: (content: string) => void;
  onCancel: () => void;
}

export function PreSendPreviewModal({
  isOpen,
  recipient,
  content: initialContent,
  triggerType,
  onSend,
  onCancel
}: PreSendPreviewModalProps) {
  const [content, setContent] = useState(initialContent);
  const [isEditing, setIsEditing] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setContent(initialContent);
      setCountdown(10);
      setIsPaused(false);
      setIsEditing(false);
    }
  }, [isOpen, initialContent]);

  useEffect(() => {
    if (!isOpen || isPaused || isEditing || countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, isPaused, isEditing, countdown]);

  useEffect(() => {
    if (countdown === 0 && !isPaused && !isEditing && isOpen) {
      onSend(content);
    }
  }, [countdown, isPaused, isEditing, isOpen, onSend, content]);

  const handleEdit = () => {
    setIsEditing(true);
    setIsPaused(true);
  };

  const handleSendNow = () => {
    onSend(content);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Auto-Sending Message</span>
            {!isEditing && !isPaused && countdown > 0 && (
              <span className="text-sm font-normal text-muted-foreground">
                in {countdown}s...
              </span>
            )}
          </DialogTitle>
          <DialogDescription>
            Trigger: <span className="font-medium capitalize">{triggerType}</span> • Recipient: <span className="font-medium">{recipient}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {isEditing ? (
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              className="resize-none"
            />
          ) : (
            <div className="bg-muted/50 p-4 rounded-md border text-sm whitespace-pre-wrap">
              {content}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          {isEditing ? (
            <Button onClick={handleSendNow}>
              <Send className="mr-2 h-4 w-4" />
              Send Now
            </Button>
          ) : (
            <div className="flex gap-2 w-full sm:w-auto">
              <Button variant="secondary" onClick={handleEdit} className="flex-1 sm:flex-none">
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button onClick={handleSendNow} className="flex-1 sm:flex-none">
                {countdown > 0 && !isPaused ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Now
                  </>
                )}
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
