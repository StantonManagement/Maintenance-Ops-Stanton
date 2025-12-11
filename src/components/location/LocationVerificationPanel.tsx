import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LocationVerification } from '@/hooks/useLocationVerification';
import { format } from 'date-fns';

interface LocationVerificationPanelProps {
  verifications: LocationVerification[];
  onOverride: (id: string) => void;
}

export function LocationVerificationPanel({ verifications, onOverride }: LocationVerificationPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Location History</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {verifications.length === 0 ? (
          <p className="text-sm text-muted-foreground">No verification history.</p>
        ) : (
          verifications.map(v => (
            <div key={v.id} className="flex items-center justify-between border-b pb-2 last:border-0">
              <div>
                <div className="font-medium capitalize flex items-center gap-2">
                  {v.verification_type.replace('_', ' ')}
                  {v.verified ? (
                     <span className="text-xs text-green-600 bg-green-100 px-1.5 py-0.5 rounded">Verified</span>
                  ) : (
                     <span className="text-xs text-red-600 bg-red-100 px-1.5 py-0.5 rounded">Failed</span>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  {format(new Date(v.created_at), 'MMM d, h:mm a')}
                </div>
                {!v.verified && v.distance_feet !== undefined && (
                  <div className="text-xs text-red-500">
                    {v.distance_feet}ft from property
                  </div>
                )}
                {v.override_reason && (
                  <div className="text-xs text-amber-600 mt-1">
                    Override: {v.override_reason}
                  </div>
                )}
              </div>
              <div>
                {!v.verified && !v.override_reason && (
                  <Button size="sm" variant="outline" onClick={() => onOverride(v.id)}>
                    Override
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
