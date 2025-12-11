import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { useAccessTracking } from "../hooks/useAccessTracking";
import { AttemptMethod, ContactResult } from "../types";
import { UserX } from "lucide-react";

interface LogAccessAttemptModalProps {
  isOpen: boolean;
  onClose: () => void;
  workOrderId: string;
}

export function LogAccessAttemptModal({ isOpen, onClose, workOrderId }: LogAccessAttemptModalProps) {
  const { logAccessAttempt } = useAccessTracking(workOrderId);
  
  const [method, setMethod] = useState<AttemptMethod>("phone");
  const [result, setResult] = useState<ContactResult>("no_answer");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    const success = await logAccessAttempt({
      method,
      result,
      notes,
      user: "Kristine" // Mock user
    });
    setLoading(false);
    
    if (success) {
      onClose();
      setMethod("phone");
      setResult("no_answer");
      setNotes("");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserX className="h-5 w-5 text-gray-500" />
            Log Access Attempt
          </DialogTitle>
          <DialogDescription>
            Document an unsuccessful attempt to contact the tenant or enter the unit.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Attempt Method</Label>
            <Select value={method} onValueChange={(v) => setMethod(v as AttemptMethod)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="phone">Phone Call</SelectItem>
                <SelectItem value="text">SMS / Text</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="in_person">In Person Visit</SelectItem>
                <SelectItem value="letter">Posted Notice</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Result</Label>
            <Select value={result} onValueChange={(v) => setResult(v as ContactResult)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no_answer">No Answer</SelectItem>
                <SelectItem value="voicemail">Left Voicemail</SelectItem>
                <SelectItem value="refused">Entry Refused</SelectItem>
                <SelectItem value="rescheduled">Rescheduled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea 
              placeholder="Details about the attempt (e.g., 'Knocked 3 times, no answer', 'Tenant shouted go away')"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Logging..." : "Log Attempt"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
