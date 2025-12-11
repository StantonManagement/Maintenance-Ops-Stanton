import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, AlertTriangle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { PhotoAnalysisResult } from '@/hooks/usePhotoAnalysis';
import { useState } from 'react';

interface PhotoAnalysisPanelProps {
  result: PhotoAnalysisResult;
  onApprove?: () => void;
  onReject?: () => void;
}

export function PhotoAnalysisPanel({ result, onApprove, onReject }: PhotoAnalysisPanelProps) {
  const [expanded, setExpanded] = useState(false);

  const getStatusColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-amber-600';
    return 'text-red-600';
  };

  const getStatusIcon = (score: number) => {
    if (score >= 90) return <CheckCircle className="w-4 h-4 text-green-600" />;
    if (score >= 75) return <AlertTriangle className="w-4 h-4 text-amber-600" />;
    return <XCircle className="w-4 h-4 text-red-600" />;
  };

  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              AI Analysis
              <Badge variant={
                result.recommendation === 'APPROVE' ? 'default' : 
                result.recommendation === 'REJECT' ? 'destructive' : 'secondary'
              }>
                {result.recommendation} ({result.overall_confidence}%)
              </Badge>
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {result.ai_notes}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)}>
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
      </CardHeader>
      
      {expanded && (
        <CardContent className="space-y-4 pt-0">
          <div className="grid gap-3 mt-4">
            <ScoreRow label="Completeness" score={result.completeness_score} />
            <ScoreRow label="Before/After Comparison" score={result.before_after_score} />
            <ScoreRow label="Cleanup Verification" score={result.cleanup_score} />
            <ScoreRow label="Photo Quality" score={result.quality_score} />
            <ScoreRow label="Location Check" score={result.location_score} />
          </div>

          {result.issues_found && result.issues_found.length > 0 && (
            <div className="bg-destructive/10 p-3 rounded-md mt-4">
              <h4 className="text-sm font-semibold text-destructive mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Issues Detected
              </h4>
              <ul className="text-sm space-y-1">
                {result.issues_found.map((issue, i) => (
                  <li key={i} className="text-destructive/90">• {issue}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
            {onReject && (
              <Button variant="outline" onClick={onReject} className="text-destructive hover:text-destructive">
                Reject
              </Button>
            )}
            {onApprove && (
              <Button onClick={onApprove} className="bg-green-600 hover:bg-green-700">
                Approve Work
              </Button>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );

  function ScoreRow({ label, score }: { label: string, score: number }) {
    return (
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span>{label}</span>
          <div className="flex items-center gap-2">
            <span className={`font-mono font-medium ${getStatusColor(score)}`}>
              {score}%
            </span>
            {getStatusIcon(score)}
          </div>
        </div>
        <Progress value={score} className="h-1.5" />
      </div>
    );
  }
}
