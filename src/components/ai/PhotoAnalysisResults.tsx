import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { CheckCircle2, AlertTriangle, Camera, RefreshCw } from "lucide-react";
import { Button } from "../ui/button";

interface PhotoAnalysisResultsProps {
  confidence: number;
  cleanlinessScore: number;
  issuesDetected: string[];
  suggestion: 'approve' | 'rework';
  onAction: (action: 'approve' | 'rework') => void;
}

export function PhotoAnalysisResults({
  confidence,
  cleanlinessScore,
  issuesDetected,
  suggestion,
  onAction
}: PhotoAnalysisResultsProps) {
  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2">
            <Camera className="h-4 w-4 text-blue-500" />
            AI Photo Analysis
          </span>
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            {confidence}% Confidence
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-muted/30 p-3 rounded-lg">
            <span className="text-sm font-medium">AI Recommendation:</span>
            {suggestion === 'approve' ? (
              <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200 gap-1">
                <CheckCircle2 className="h-3 w-3" /> Approve
              </Badge>
            ) : (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" /> Request Rework
              </Badge>
            )}
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Cleanliness Score</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                  <div 
                    key={i} 
                    className={`h-2 w-2 rounded-full ${i <= cleanlinessScore ? 'bg-green-500' : 'bg-gray-200'}`} 
                  />
                ))}
              </div>
            </div>
            
            {issuesDetected.length > 0 ? (
              <div>
                <div className="text-muted-foreground mb-1">Detected Issues:</div>
                <ul className="list-disc list-inside text-red-600 space-y-1">
                  {issuesDetected.map((issue, i) => (
                    <li key={i}>{issue}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="text-green-600 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                No visible issues detected
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <Button 
              className="flex-1 bg-green-600 hover:bg-green-700" 
              size="sm"
              onClick={() => onAction('approve')}
            >
              Accept & Approve
            </Button>
            <Button 
              variant="outline" 
              className="flex-1 text-amber-600 hover:text-amber-700 border-amber-200 hover:bg-amber-50" 
              size="sm"
              onClick={() => onAction('rework')}
            >
              <RefreshCw className="mr-2 h-3 w-3" />
              Request Rework
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
