import { Badge } from "./ui/badge";
import { Building, CheckCircle, Clock } from "lucide-react";
import type { VendorRequestStatus } from "../types";

interface VendorRequestBadgeProps {
  status: VendorRequestStatus;
  count?: number;
}

export function VendorRequestBadge({ status, count }: VendorRequestBadgeProps) {
  if (status === 'pending') {
    return (
      <Badge variant="outline" className="gap-1 bg-yellow-50 text-yellow-700 border-yellow-200">
        <Building className="h-3 w-3" />
        <span>Vendor Requested</span>
      </Badge>
    );
  }

  if (status === 'responses_received') {
    return (
      <Badge variant="outline" className="gap-1 bg-blue-50 text-blue-700 border-blue-200">
        <Clock className="h-3 w-3" />
        <span>{count} Vendor Responses</span>
      </Badge>
    );
  }

  if (status === 'vendor_selected') {
    return (
      <Badge variant="outline" className="gap-1 bg-green-50 text-green-700 border-green-200">
        <CheckCircle className="h-3 w-3" />
        <span>Vendor Assigned</span>
      </Badge>
    );
  }

  return null;
}
