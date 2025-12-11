import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PartsPrediction, PredictedPart } from '@/hooks/usePartsPrediction';
import { Wrench, Package, Info, CheckSquare, Square } from 'lucide-react';

interface PartsPredictionPanelProps {
  prediction: PartsPrediction;
}

export function PartsPredictionPanel({ prediction }: PartsPredictionPanelProps) {
  const highConf = prediction.predicted_parts.filter(p => p.category === 'high');
  const mediumConf = prediction.predicted_parts.filter(p => p.category === 'medium');
  const conditional = prediction.predicted_parts.filter(p => p.category === 'conditional');

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg flex items-center gap-2">
            <Package className="w-5 h-5" />
            Predicted Parts & Tools
          </CardTitle>
          <Badge variant="outline">AI Assistant</Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {prediction.prediction_reasoning}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* High Confidence */}
        {highConf.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-green-700 mb-2 flex items-center gap-2">
              <CheckSquare className="w-4 h-4" />
              Bring These (High Confidence)
            </h4>
            <div className="space-y-2">
              {highConf.map((part, i) => (
                <PartItem key={i} part={part} />
              ))}
            </div>
          </div>
        )}

        {/* Medium Confidence */}
        {mediumConf.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-amber-700 mb-2 flex items-center gap-2">
              <Square className="w-4 h-4" />
              Consider Bringing (Medium Confidence)
            </h4>
            <div className="space-y-2">
              {mediumConf.map((part, i) => (
                <PartItem key={i} part={part} />
              ))}
            </div>
          </div>
        )}

        {/* Conditional */}
        {conditional.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-blue-700 mb-2 flex items-center gap-2">
              <Info className="w-4 h-4" />
              Conditional Items
            </h4>
            <div className="space-y-2">
              {conditional.map((part, i) => (
                <PartItem key={i} part={part} />
              ))}
            </div>
          </div>
        )}

        {(highConf.length === 0 && mediumConf.length === 0 && conditional.length === 0) && (
           <p className="text-sm text-muted-foreground italic">No specific parts predicted.</p>
        )}

        <Separator />

        {/* Tools */}
        <div>
           <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
             <Wrench className="w-4 h-4" />
             Suggested Tools
           </h4>
           {prediction.suggested_tools && prediction.suggested_tools.length > 0 ? (
             <div className="flex flex-wrap gap-2">
               {prediction.suggested_tools.map((tool, i) => (
                 <Badge key={i} variant="secondary">{tool}</Badge>
               ))}
             </div>
           ) : (
             <p className="text-sm text-muted-foreground">Standard tool kit only.</p>
           )}
        </div>

      </CardContent>
    </Card>
  );
}

function PartItem({ part }: { part: PredictedPart }) {
  return (
    <div className="bg-muted/30 p-2 rounded border flex justify-between items-center text-sm">
      <div>
        <div className="font-medium">
          {part.part}
          {part.part_number && <span className="text-muted-foreground ml-2 text-xs">#{part.part_number}</span>}
        </div>
        <div className="text-xs text-muted-foreground">{part.reason}</div>
        {part.condition && <div className="text-xs text-blue-600 mt-0.5">If: {part.condition}</div>}
      </div>
      <Badge variant="outline" className="text-xs">
        {part.confidence}%
      </Badge>
    </div>
  );
}
