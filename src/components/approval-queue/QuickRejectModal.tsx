import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface QuickRejectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReject: (reason: string) => void;
}

const REASONS = [
  "Work incomplete",
  "Quality issues",
  "Missing photos",
  "Cleanup not done",
  "Other"
];

export function QuickRejectModal({ isOpen, onClose, onReject }: QuickRejectModalProps) {
  const [reason, setReason] = useState<string>('Work incomplete');
  const [notes, setNotes] = useState('');

  const handleSubmit = () => {
    const finalReason = reason === 'Other' ? notes : reason;
    if (!finalReason) return;
    onReject(`${finalReason}${reason !== 'Other' && notes ? `: ${notes}` : ''}`);
    setNotes('');
    setReason('Work incomplete');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Reject Work Order</DialogTitle>
          <DialogDescription>
            Why are you returning this work order? The technician will be notified.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <RadioGroup value={reason} onValueChange={setReason} className="grid gap-2">
            {REASONS.map((r) => (
              <div key={r} className="flex items-center space-x-2">
                <RadioGroupItem value={r} id={r} />
                <Label htmlFor={r}>{r}</Label>
              </div>
            ))}
          </RadioGroup>
          
          {(reason === 'Other' || reason) && (
            <div className="grid w-full gap-1.5">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea 
                id="notes" 
                placeholder="Add specific details..." 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" onClick={handleSubmit}>Reject & Return</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
