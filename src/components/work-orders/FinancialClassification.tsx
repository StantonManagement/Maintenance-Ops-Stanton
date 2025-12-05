import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';
import { CheckCircle2, HelpCircle, DollarSign } from 'lucide-react';
import { useFinancialClassification } from '../../hooks/useFinancialClassification';

interface FinancialClassificationProps {
  description: string;
  workType: string;
  currentCategory?: 'capex' | 'maintenance' | 'unclassified';
  onSave: (data: any) => void;
}

export function FinancialClassification({ description, workType, currentCategory = 'unclassified', onSave }: FinancialClassificationProps) {
  const { classifyWorkOrder, loading } = useFinancialClassification();
  const [category, setCategory] = useState<'capex' | 'maintenance' | 'unclassified'>(currentCategory);
  const [confidence, setConfidence] = useState<'high' | 'medium' | 'low'>('low');
  const [reason, setReason] = useState<string>('');
  const [lifespan, setLifespan] = useState<number>(0);
  const [responsibility, setResponsibility] = useState<'owner' | 'tenant' | 'shared'>('owner');
  const [costEstimate, setCostEstimate] = useState<string>('');

  useEffect(() => {
    if (currentCategory === 'unclassified' && description) {
      const result = classifyWorkOrder(description, workType);
      setCategory(result.category);
      setConfidence(result.confidence);
      setReason(result.reason);
      setLifespan(result.lifespan);
    }
  }, [description, workType, currentCategory]);

  const handleSave = () => {
    onSave({
      category,
      responsibility,
      lifespan,
      costEstimate: parseFloat(costEstimate) || 0
    });
  };

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-blue-500" />
            Financial Classification
          </CardTitle>
          {confidence !== 'low' && (
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              AI Confidence: {confidence.toUpperCase()}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* AI Reason */}
        {reason && (
          <div className="bg-muted/50 p-3 rounded-md text-sm flex gap-2 items-start">
            <HelpCircle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <span className="text-muted-foreground">{reason}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={(v: any) => setCategory(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="maintenance">Maintenance (OpEx)</SelectItem>
                <SelectItem value="capex">Capital Expenditure (CapEx)</SelectItem>
                <SelectItem value="unclassified">Unclassified</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Responsibility</Label>
            <Select value={responsibility} onValueChange={(v: any) => setResponsibility(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="owner">Owner</SelectItem>
                <SelectItem value="tenant">Tenant (Billable)</SelectItem>
                <SelectItem value="shared">Shared</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {category === 'capex' && (
          <div className="space-y-2">
            <Label>Estimated Lifespan (Years)</Label>
            <div className="flex items-center gap-2">
              <input 
                type="number" 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={lifespan}
                onChange={(e) => setLifespan(parseInt(e.target.value))}
              />
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                Min 1 year for CapEx
              </span>
            </div>
          </div>
        )}

        <div className="pt-2 flex justify-end">
          <Button size="sm" onClick={handleSave} disabled={loading}>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Confirm Classification
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
