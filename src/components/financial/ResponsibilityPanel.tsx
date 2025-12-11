import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ResponsibilityDetermination, TenantCharge } from '@/hooks/useResponsibility';
import { AlertCircle, User, Building, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { Input } from '@/components/ui/input';

interface ResponsibilityPanelProps {
  determination: ResponsibilityDetermination;
  existingCharge?: TenantCharge | null;
  onCreateCharge: (amount: number, description: string) => void;
}

export function ResponsibilityPanel({ determination, existingCharge, onCreateCharge }: ResponsibilityPanelProps) {
  const [chargeAmount, setChargeAmount] = useState<string>(determination.recommended_charge?.toString() || '');
  const [description, setDescription] = useState(determination.responsibility_reasoning);

  const getResponsibilityColor = (resp: string) => {
    switch (resp) {
      case 'tenant': return 'destructive';
      case 'owner': return 'secondary';
      case 'shared': return 'outline';
      default: return 'secondary';
    }
  };

  const handleCreateCharge = () => {
    const amount = parseFloat(chargeAmount);
    if (!isNaN(amount) && amount > 0) {
      onCreateCharge(amount, description);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg flex items-center gap-2">
            Responsibility
            <Badge variant={getResponsibilityColor(determination.responsibility)}>
              {determination.responsibility.toUpperCase()}
            </Badge>
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            Confidence: <span className="font-medium text-foreground">{determination.responsibility_confidence}%</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Reasoning Section */}
        <div className="bg-muted/30 p-3 rounded-md border">
          <div className="flex gap-2 mb-2">
            <div className="mt-0.5">⚖️</div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {determination.responsibility_reasoning}
            </p>
          </div>
          
          {determination.key_factors && (
            <div className="mt-2 pl-7">
              <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Key Factors</p>
              <ul className="text-sm space-y-1">
                {determination.key_factors.map((factor, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-600" />
                    {factor}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Action Section based on Responsibility */}
        {determination.responsibility === 'owner' ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/20 p-2 rounded">
            <Building className="w-4 h-4" />
            <span>Owner responsibility. No tenant charge recommended.</span>
          </div>
        ) : (
          <div className="space-y-3 pt-2 border-t">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <User className="w-4 h-4" />
              Tenant Charge
            </h4>
            
            {existingCharge ? (
              <div className="bg-green-50 border border-green-200 p-3 rounded-md">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-green-700">Charge Created</span>
                  <Badge variant="outline" className="border-green-200 text-green-700 capitalize">
                    {existingCharge.status}
                  </Badge>
                </div>
                <div className="text-2xl font-bold text-green-800">
                  ${existingCharge.amount.toFixed(2)}
                </div>
                <p className="text-xs text-green-600 mt-1">{existingCharge.description}</p>
              </div>
            ) : (
              <div className="space-y-3 bg-destructive/5 p-3 rounded-md border border-destructive/10">
                <div className="flex items-center gap-2 text-sm text-destructive font-medium">
                  <AlertCircle className="w-4 h-4" />
                  Recommended Action: Charge Tenant
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Amount ($)</label>
                    <Input 
                      type="number" 
                      value={chargeAmount} 
                      onChange={e => setChargeAmount(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                </div>
                
                <div className="space-y-1">
                  <label className="text-xs font-medium">Charge Description</label>
                  <Input 
                    value={description} 
                    onChange={e => setDescription(e.target.value)}
                  />
                </div>

                <Button 
                  className="w-full" 
                  variant="destructive"
                  onClick={handleCreateCharge}
                >
                  Confirm Charge to Tenant
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
