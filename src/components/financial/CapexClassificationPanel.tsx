import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FinancialClassification } from '@/hooks/useCapexClassification';
import { DollarSign, Clock } from 'lucide-react';
import { useState } from 'react';

interface CapexClassificationPanelProps {
  classification: FinancialClassification;
  onOverride: (category: 'capex' | 'maintenance', reason: string) => void;
}

export function CapexClassificationPanel({ classification, onOverride }: CapexClassificationPanelProps) {
  const [overrideMode, setOverrideMode] = useState(false);
  const [newCategory, setNewCategory] = useState<'capex' | 'maintenance'>(classification.financial_category);
  const [reason, setReason] = useState('');

  const handleSave = () => {
    onOverride(newCategory, reason);
    setOverrideMode(false);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg flex items-center gap-2">
            Financial Classification
            <Badge variant={classification.financial_category === 'capex' ? 'default' : 'secondary'}>
              {classification.financial_category.toUpperCase()}
            </Badge>
          </CardTitle>
          <div className="text-sm text-muted-foreground flex items-center gap-1">
            AI Confidence: <span className="font-medium text-foreground">{classification.ai_financial_confidence}%</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted/50 p-3 rounded-md text-sm">
          <div className="flex gap-2">
            <div className="mt-0.5">💡</div>
            <div>
              <p className="font-medium mb-1">Reasoning</p>
              <p className="text-muted-foreground">{classification.ai_financial_reasoning}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Work Type:</span>
            <span className="font-medium capitalize">{classification.work_type}</span>
          </div>
          {classification.ai_estimated_lifespan_years && (
             <div className="flex items-center gap-2 text-sm">
               <DollarSign className="w-4 h-4 text-muted-foreground" />
               <span className="text-muted-foreground">Est. Lifespan:</span>
               <span className="font-medium">{classification.ai_estimated_lifespan_years} years</span>
             </div>
          )}
        </div>

        {classification.capex_items && classification.capex_items.length > 0 && (
          <div className="border rounded-md p-3">
            <h4 className="text-sm font-medium mb-2">Identified CapEx Items</h4>
            <ul className="space-y-2">
              {classification.capex_items.map((item, i) => (
                <li key={i} className="text-sm flex justify-between items-center bg-background p-2 rounded border">
                  <span>{item.item_description}</span>
                  <Badge variant="outline">{item.estimated_lifespan_years} yrs</Badge>
                </li>
              ))}
            </ul>
          </div>
        )}

        {overrideMode ? (
          <div className="space-y-3 pt-2 border-t">
            <div className="space-y-1">
              <label className="text-sm font-medium">New Category</label>
              <Select value={newCategory} onValueChange={(v: any) => setNewCategory(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="capex">CapEx</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Reason for Override</label>
              <input 
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors"
                placeholder="e.g. Policy exception..."
                value={reason}
                onChange={e => setReason(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setOverrideMode(false)}>Cancel</Button>
              <Button size="sm" onClick={handleSave} disabled={!reason}>Save Override</Button>
            </div>
          </div>
        ) : (
          <div className="pt-2">
            <Button variant="outline" size="sm" className="w-full" onClick={() => setOverrideMode(true)}>
              Override Classification
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
