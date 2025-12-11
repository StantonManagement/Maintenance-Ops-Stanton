import { Button } from "@/components/ui/button";
import { X, Users, CheckCircle, Download } from "lucide-react";

interface BulkActionsToolbarProps {
  selectedCount: number;
  onAssign: () => void;
  onChangeStatus: () => void;
  onExport: () => void;
  onClearSelection: () => void;
}

export function BulkActionsToolbar({
  selectedCount,
  onAssign,
  onChangeStatus,
  onExport,
  onClearSelection
}: BulkActionsToolbarProps) {
  return (
    <div className="flex items-center justify-between p-2 bg-primary/5 border rounded-lg mb-2 animate-in fade-in slide-in-from-top-2">
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium px-2">
          {selectedCount} item{selectedCount !== 1 && 's'} selected
        </span>
        <div className="h-4 w-px bg-border" />
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onAssign} className="bg-white">
            <Users className="mr-2 h-4 w-4" />
            Assign
          </Button>
          <Button variant="outline" size="sm" onClick={onChangeStatus} className="bg-white">
            <CheckCircle className="mr-2 h-4 w-4" />
            Change Status
          </Button>
          <Button variant="outline" size="sm" onClick={onExport} className="bg-white">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>
      <Button variant="ghost" size="sm" onClick={onClearSelection}>
        <X className="h-4 w-4" />
        <span className="sr-only">Clear selection</span>
      </Button>
    </div>
  );
}
