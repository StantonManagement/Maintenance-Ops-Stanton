import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Sparkles, Check, X } from "lucide-react";
import { useState } from "react";

interface AISuggestionCardProps {
  title: string;
  description: string;
  confidence: number;
  reasoning: string;
  onAccept: () => void;
  onReject: () => void;
}

export function AISuggestionCard({
  title,
  description,
  confidence,
  reasoning,
  onAccept,
  onReject,
}: AISuggestionCardProps) {
  const [expanded, setExpanded] = useState(false);

  const getConfidenceColor = (score: number) => {
    if (score >= 90) return 'bg-green-500';
    if (score >= 70) return 'bg-blue-500';
    return 'bg-amber-500';
  };

  return (
    <Card className="border-blue-100 bg-blue-50/30 overflow-hidden">
      <CardHeader className="pb-2 pt-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2 text-blue-700">
            <Sparkles className="h-4 w-4" />
            AI Suggestion
          </CardTitle>
          <Badge variant="outline" className="bg-white/50 text-xs">
            {confidence}% Confidence
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="mb-3">
          <h4 className="font-semibold text-sm mb-1">{title}</h4>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <div className="h-1.5 flex-1 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full ${getConfidenceColor(confidence)}`} 
              style={{ width: `${confidence}%` }}
            />
          </div>
        </div>

        {expanded && (
          <div className="mb-4 p-3 bg-white/50 rounded-md text-xs text-muted-foreground border border-blue-100">
            <div className="font-medium mb-1 text-blue-700">Reasoning:</div>
            {reasoning}
          </div>
        )}

        <div className="flex items-center justify-between">
          <button 
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-blue-600 hover:underline"
          >
            {expanded ? 'Hide details' : 'Why this suggestion?'}
          </button>
          
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 hover:bg-red-100 hover:text-red-600" onClick={onReject}>
              <X className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 hover:bg-green-100 hover:text-green-600" onClick={onAccept}>
              <Check className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
