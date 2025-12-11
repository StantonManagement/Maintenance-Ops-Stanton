import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { useVendorRequests } from "../hooks/useVendorRequests";
import { Building, DollarSign, Calendar } from "lucide-react";

interface VendorRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  workOrderId: string;
  defaultCategory?: string;
}

export function VendorRequestModal({ isOpen, onClose, workOrderId, defaultCategory }: VendorRequestModalProps) {
  const { createVendorRequest, getQualifiedVendors } = useVendorRequests();
  
  const [category, setCategory] = useState(defaultCategory || "");
  const [urgency, setUrgency] = useState("standard");
  const [details, setDetails] = useState("");
  const [maxBudget, setMaxBudget] = useState("");
  const [deadline, setDeadline] = useState("");
  const [accessInfo, setAccessInfo] = useState("");
  const [qualifiedCount, setQualifiedCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (category) {
      getQualifiedVendors(category).then(vendors => setQualifiedCount(vendors.length));
    } else {
      setQualifiedCount(0);
    }
  }, [category, getQualifiedVendors]);

  const handleSubmit = async () => {
    if (!category || !details || !deadline) return;

    setLoading(true);
    const success = await createVendorRequest({
      workOrderId,
      category,
      urgency,
      requestDetails: details,
      maxBudget: maxBudget ? parseFloat(maxBudget) : undefined,
      responseDeadline: new Date(deadline).toISOString(),
      buildingAccessInfo: accessInfo
    });
    setLoading(false);

    if (success) {
      onClose();
      // Reset form
      setDetails("");
      setMaxBudget("");
      setAccessInfo("");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="h-5 w-5 text-gray-500" />
            Request Vendor Proposals
          </DialogTitle>
          <DialogDescription>
            Send a request to qualified vendors. They can accept, decline, or submit a quote.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6 py-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select trade..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Plumbing">Plumbing</SelectItem>
                  <SelectItem value="Electrical">Electrical</SelectItem>
                  <SelectItem value="HVAC">HVAC</SelectItem>
                  <SelectItem value="Appliance">Appliance Repair</SelectItem>
                  <SelectItem value="Locksmith">Locksmith</SelectItem>
                  <SelectItem value="General">General Handyman</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Urgency</Label>
              <Select value={urgency} onValueChange={setUrgency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard (3-5 days)</SelectItem>
                  <SelectItem value="urgent">Urgent (24-48 hours)</SelectItem>
                  <SelectItem value="emergency">Emergency (Immediate)</SelectItem>
                  <SelectItem value="project">Project (Flexible)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Response Deadline</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <Input 
                  type="datetime-local" 
                  className="pl-9"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Max Budget (Optional)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <Input 
                  type="number" 
                  className="pl-9" 
                  placeholder="0.00"
                  value={maxBudget}
                  onChange={(e) => setMaxBudget(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Request Details / Scope of Work</Label>
              <Textarea 
                className="h-32" 
                placeholder="Describe the issue in detail..."
                value={details}
                onChange={(e) => setDetails(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Building Access Info</Label>
              <Textarea 
                className="h-20" 
                placeholder="Lockbox codes, key location, tenant contact info..."
                value={accessInfo}
                onChange={(e) => setAccessInfo(e.target.value)}
              />
            </div>
          </div>
        </div>

        {category && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm text-blue-800 flex justify-between items-center">
            <span>Based on category <strong>{category}</strong>:</span>
            <span className="font-semibold">{qualifiedCount} vendors will be notified</span>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading || !category || !details || !deadline}>
            {loading ? "Sending..." : "Send Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
