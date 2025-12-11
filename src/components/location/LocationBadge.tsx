import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle } from 'lucide-react';

interface LocationBadgeProps {
  verified?: boolean;
  distance?: number;
  loading?: boolean;
}

export function LocationBadge({ verified, distance, loading }: LocationBadgeProps) {
  if (loading) return <Badge variant="outline">Verifying...</Badge>;
  
  if (verified) {
    return (
      <Badge variant="default" className="bg-green-600 hover:bg-green-700">
        <CheckCircle className="w-3 h-3 mr-1" />
        Verified
      </Badge>
    );
  }
  
  // Not verified (or undefined/null which we treat as not verified if not loading)
  return (
    <Badge variant="destructive">
      <AlertTriangle className="w-3 h-3 mr-1" />
      Mismatch {distance ? `(${distance}ft)` : ''}
    </Badge>
  );
}
