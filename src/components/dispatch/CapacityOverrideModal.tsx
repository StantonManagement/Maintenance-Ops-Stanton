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
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Checkbox } from "../ui/checkbox";
import { useState } from "react";
import { AlertTriangle } from "lucide-react";

interface CapacityOverrideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string, notes: string) => void;
  technicianName: string;
  currentLoad: number;
  maxLoad: number;
}

export function CapacityOverrideModal({
  isOpen,
  onClose,
  onConfirm,
  technicianName,
  currentLoad,
  maxLoad
}: CapacityOverrideModalProps) {
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);

  const handleConfirm = () => {
    if (acknowledged && reason) {
      onConfirm(reason, notes);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Capacity Warning
          </DialogTitle>
          <DialogDescription className="pt-2">
            <span className="font-semibold text-foreground">{technicianName}</span> is currently at capacity 
            ({currentLoad}/{maxLoad} active jobs). Assigning more work requires an override.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-sm text-amber-800">
            <strong>Policy:</strong> Overrides trigger an automatic notification to maintenance coordinators.
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Override Reason <span className="text-red-500">*</span></Label>
            <Select onValueChange={setReason} value={reason}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="emergency">Emergency / Safety Hazard</SelectItem>
                <SelectItem value="turnover">Urgent Turnover</SelectItem>
                <SelectItem value="manager_request">Manager Request</SelectItem>
                <SelectItem value="specialist">Only Specialist Available</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Explain why this override is necessary..."
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <Checkbox 
              id="acknowledge" 
              checked={acknowledged}
              onCheckedChange={(c) => setAcknowledged(c as boolean)}
            />
            <label
              htmlFor="acknowledge"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              I understand this will log an override event.
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            variant="destructive" 
            onClick={handleConfirm}
            disabled={!acknowledged || !reason}
          >
            Confirm Override
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
