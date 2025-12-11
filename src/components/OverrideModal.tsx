import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { useOverrides } from "../hooks/useOverrides";
import { useTechnicians } from "../hooks/useTechnicians";
import { OverrideReason } from "../types";
import { AlertTriangle } from "lucide-react";

interface OverrideModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTechnicianId?: string;
}

export function OverrideModal({ isOpen, onClose, defaultTechnicianId }: OverrideModalProps) {
  const { createOverride, getDisplacedWorkOrders } = useOverrides();
  const { technicians } = useTechnicians();

  const [technicianId, setTechnicianId] = useState(defaultTechnicianId || "");
  const [reason, setReason] = useState<OverrideReason>("emergency");
  const [details, setDetails] = useState("");
  const [targetWorkOrderId, setTargetWorkOrderId] = useState("");
  const [displacedCount, setDisplacedCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (defaultTechnicianId) setTechnicianId(defaultTechnicianId);
  }, [defaultTechnicianId]);

  useEffect(() => {
    if (technicianId) {
      getDisplacedWorkOrders(technicianId).then(ids => setDisplacedCount(ids.length));
    } else {
      setDisplacedCount(null);
    }
  }, [technicianId, getDisplacedWorkOrders]);

  const handleSubmit = async () => {
    if (!technicianId || !reason || !details) return;
    
    // For emergency, we need a work order ID. For others, we generate a reference.
    const woId = reason === 'emergency' 
      ? targetWorkOrderId 
      : `OVERRIDE-${reason.toUpperCase()}-${Date.now()}`;

    if (reason === 'emergency' && !woId) {
      alert("Please enter the Emergency Work Order ID");
      return;
    }

    setLoading(true);
    const tech = technicians.find(t => t.id === technicianId);
    const displaced = await getDisplacedWorkOrders(technicianId);

    const success = await createOverride({
      workOrderId: woId,
      technicianId,
      technicianName: tech?.name || "Unknown",
      reason,
      details,
      displacedWorkOrders: displaced,
      overrideBy: "Dean" // Mocking current user
    });

    setLoading(false);
    if (success) {
      onClose();
      // Reset form
      setReason("emergency");
      setDetails("");
      setTargetWorkOrderId("");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Emergency Override
          </DialogTitle>
          <DialogDescription>
            Pull a technician from their scheduled work. This will alert the coordinator.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Technician</Label>
            <Select value={technicianId} onValueChange={setTechnicianId}>
              <SelectTrigger>
                <SelectValue placeholder="Select technician..." />
              </SelectTrigger>
              <SelectContent>
                {technicians.map(t => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Reason</Label>
            <Select value={reason} onValueChange={(v) => setReason(v as OverrideReason)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="emergency">Emergency Work Order</SelectItem>
                <SelectItem value="turnover">Turnover Priority</SelectItem>
                <SelectItem value="inspection">Inspection Prep</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {reason === 'emergency' && (
            <div className="space-y-2">
              <Label>Emergency Work Order ID</Label>
              <Input 
                placeholder="e.g. 12345" 
                value={targetWorkOrderId}
                onChange={(e) => setTargetWorkOrderId(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>Details / Notes</Label>
            <Textarea 
              placeholder="Why is this override necessary?"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
            />
          </div>

          {displacedCount !== null && displacedCount > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-sm text-amber-800">
              ⚠️ This will displace <strong>{displacedCount}</strong> scheduled work orders.
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading || !technicianId}>
            {loading ? "Logging..." : "Confirm Override"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
