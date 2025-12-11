import { useEffect } from "react";
import { useVendorRequests } from "../hooks/useVendorRequests";
import { Button } from "./ui/button";
import { CheckCircle, Clock, DollarSign, XCircle } from "lucide-react";
import { format } from "date-fns";

interface VendorResponsesPanelProps {
  requestId: string;
}

export function VendorResponsesPanel({ requestId }: VendorResponsesPanelProps) {
  const { responses, fetchRequestResponses, selectVendor } = useVendorRequests();

  useEffect(() => {
    fetchRequestResponses(requestId);
  }, [fetchRequestResponses, requestId]);

  if (responses.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg border border-dashed">
        Waiting for vendor responses...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-sm text-gray-700">Vendor Responses ({responses.length})</h3>
      <div className="grid gap-3">
        {responses.map((response) => (
          <div 
            key={response.id} 
            className={`p-4 rounded-lg border text-sm ${
              response.responseStatus === 'accepted' ? 'bg-green-50 border-green-200' :
              response.responseStatus === 'declined' ? 'bg-gray-50 border-gray-200 opacity-75' :
              'bg-white border-gray-200'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="font-semibold block">{response.vendorName}</span>
                <span className="text-xs text-gray-500">
                  Responded {format(new Date(response.respondedAt), "MMM d, h:mm a")}
                </span>
              </div>
              {response.responseStatus === 'declined' ? (
                <div className="flex items-center text-red-600 text-xs font-medium">
                  <XCircle className="h-3 w-3 mr-1" />
                  Declined
                </div>
              ) : response.responseStatus === 'accepted' ? ( // Accepted the REQUEST (vendor said yes) or Selected?
                // The DB status is 'accepted' if vendor said yes to doing it (or quoted).
                // Wait, selectVendor updates status to 'accepted'? No, 'vendor_selected' on request.
                // Response status is 'accepted', 'declined', 'quoted'.
                // If I select a vendor, I update request status.
                // Let's assume 'accepted' means they are willing to do the job.
                <div className="flex items-center text-green-600 text-xs font-medium">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Available
                </div>
              ) : (
                <div className="flex items-center text-blue-600 text-xs font-medium">
                  <Clock className="h-3 w-3 mr-1" />
                  {response.responseStatus}
                </div>
              )}
            </div>

            {response.responseStatus !== 'declined' && (
              <div className="grid grid-cols-2 gap-4 mt-3 bg-white/50 p-2 rounded">
                <div>
                  <span className="text-xs text-gray-500 block">Proposed Timeline</span>
                  <div className="flex items-center gap-1 font-medium">
                    <Clock className="h-3 w-3 text-gray-400" />
                    {response.proposedTimeline || "N/A"}
                  </div>
                </div>
                <div>
                  <span className="text-xs text-gray-500 block">Quote Amount</span>
                  <div className="flex items-center gap-1 font-medium">
                    <DollarSign className="h-3 w-3 text-gray-400" />
                    {response.quotedAmount ? `$${response.quotedAmount.toFixed(2)}` : "TBD"}
                  </div>
                </div>
              </div>
            )}

            {response.notes && (
              <p className="mt-3 text-xs text-gray-600 italic">"{response.notes}"</p>
            )}

            {response.responseStatus !== 'declined' && (
              <div className="mt-3 pt-3 border-t flex justify-end">
                <Button 
                  size="sm" 
                  onClick={() => selectVendor(requestId, response.vendorId)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Select Vendor
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
