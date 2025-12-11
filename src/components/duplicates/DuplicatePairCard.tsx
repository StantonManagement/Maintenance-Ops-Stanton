import { useState } from 'react';
import { GitMerge, X, ChevronDown, ChevronUp, Clock, MapPin, AlertTriangle, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';
import { DuplicateCandidate } from '../../hooks/useDuplicateCandidates';

interface DuplicatePairCardProps {
  candidate: DuplicateCandidate;
  onMerge: (id: string, mergeNote?: string) => void;
  onDismiss: (id: string) => void;
  onAnalyze?: (candidate: DuplicateCandidate) => void;
  isAnalyzing?: boolean;
  isSelected?: boolean;
  onSelect?: (id: string, selected: boolean) => void;
}

export function DuplicatePairCard({
  candidate,
  onMerge,
  onDismiss,
  onAnalyze,
  isAnalyzing = false,
  isSelected = false,
  onSelect,
}: DuplicatePairCardProps) {
  const [expanded, setExpanded] = useState(false);

  const getConfidenceColor = (score: number) => {
    if (score >= 0.85) return { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' };
    if (score >= 0.70) return { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300' };
    return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' };
  };

  const getAIRecommendationStyle = () => {
    if (!candidate.aiRecommendation) return null;
    const conf = candidate.aiConfidence || 0;
    
    switch (candidate.aiRecommendation) {
      case 'MERGE':
        if (conf >= 85) return { border: 'border-green-400', bg: 'bg-green-50', text: 'text-green-700', label: 'AI: Merge ✓' };
        return { border: 'border-yellow-400', bg: 'bg-yellow-50', text: 'text-yellow-700', label: 'AI: Likely Merge' };
      case 'NOT_DUPLICATE':
        return { border: 'border-gray-400', bg: 'bg-gray-50', text: 'text-gray-700', label: 'AI: Not Duplicate' };
      case 'NEEDS_REVIEW':
        return { border: 'border-orange-400', bg: 'bg-orange-50', text: 'text-orange-700', label: 'AI: Needs Review' };
      default:
        return null;
    }
  };

  const aiStyle = getAIRecommendationStyle();
  const confidenceStyle = getConfidenceColor(candidate.confidenceScore);
  const isUrgent = candidate.hoursPending > 24;
  const hasAIAnalysis = !!candidate.aiAnalyzedAt;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Unknown';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const cardBorderClass = aiStyle ? `border-2 ${aiStyle.border}` : '';

  return (
    <Card className={`p-4 ${isSelected ? 'ring-2 ring-blue-500' : ''} ${cardBorderClass}`}>
      {/* AI Analysis Section */}
      {hasAIAnalysis && aiStyle && (
        <div className={`-mx-4 -mt-4 mb-4 px-4 py-3 ${aiStyle.bg} border-b ${aiStyle.border}`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className={`h-4 w-4 ${aiStyle.text}`} />
              <span className={`font-medium ${aiStyle.text}`}>{aiStyle.label}</span>
              <Badge variant="outline" className="text-xs">
                {candidate.aiConfidence}% confident
              </Badge>
            </div>
            {!hasAIAnalysis && onAnalyze && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onAnalyze(candidate)}
                disabled={isAnalyzing}
                className="gap-1 text-xs"
              >
                {isAnalyzing ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Sparkles className="h-3 w-3" />
                )}
                Analyze
              </Button>
            )}
          </div>
          {candidate.aiReasoning && (
            <p className="text-sm text-gray-700 mt-2">{candidate.aiReasoning}</p>
          )}
          {candidate.aiMergeNote && (
            <p className="text-xs text-gray-600 mt-2 italic">
              If merged: "{candidate.aiMergeNote}"
            </p>
          )}
        </div>
      )}

      {/* Analyze button if no AI analysis yet */}
      {!hasAIAnalysis && onAnalyze && (
        <div className="mb-3 p-2 bg-gray-50 rounded-lg flex items-center justify-between">
          <span className="text-xs text-muted-foreground">No AI analysis yet</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAnalyze(candidate)}
            disabled={isAnalyzing}
            className="gap-1 text-xs"
          >
            {isAnalyzing ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Sparkles className="h-3 w-3" />
            )}
            Analyze with AI
          </Button>
        </div>
      )}

      {/* Header Row */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {onSelect && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => onSelect(candidate.id, e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
          )}
          <div>
            <div className="flex items-center gap-2">
              <Badge className={`${confidenceStyle.bg} ${confidenceStyle.text} ${confidenceStyle.border}`}>
                {Math.round(candidate.confidenceScore * 100)}% Match
              </Badge>
              {isUrgent && (
                <Badge variant="destructive" className="gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {Math.round(candidate.hoursPending)}h pending
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {candidate.detectionReason}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDismiss(candidate.id)}
            className="gap-1"
          >
            <X className="h-3 w-3" />
            Not Duplicate
          </Button>
          <Button
            size="sm"
            onClick={() => onMerge(candidate.id, candidate.aiMergeNote || undefined)}
            className={`gap-1 ${
              candidate.aiRecommendation === 'MERGE' 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            <GitMerge className="h-3 w-3" />
            Merge
          </Button>
        </div>
      </div>

      {/* Side-by-Side Comparison */}
      <div className="grid grid-cols-2 gap-4">
        {/* Primary (Older) WO */}
        <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-blue-700">KEEP (Original)</span>
            <span className="text-xs text-blue-600">{candidate.primaryWoId}</span>
          </div>
          <p className="text-sm font-medium text-gray-900 line-clamp-2 mb-2">
            {candidate.primaryDescription || 'No description'}
          </p>
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <MapPin className="h-3 w-3" />
            <span>Unit {candidate.primaryUnit}</span>
            <span>·</span>
            <Clock className="h-3 w-3" />
            <span>{formatDate(candidate.primaryCreated)}</span>
          </div>
          <Badge variant="outline" className="mt-2 text-xs">
            {candidate.primaryStatus}
          </Badge>
        </div>

        {/* Duplicate (Newer) WO */}
        <div className="p-3 rounded-lg bg-orange-50 border border-orange-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-orange-700">MERGE (Duplicate)</span>
            <span className="text-xs text-orange-600">{candidate.duplicateWoId}</span>
          </div>
          <p className="text-sm font-medium text-gray-900 line-clamp-2 mb-2">
            {candidate.duplicateDescription || 'No description'}
          </p>
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <MapPin className="h-3 w-3" />
            <span>Unit {candidate.duplicateUnit}</span>
            <span>·</span>
            <Clock className="h-3 w-3" />
            <span>{formatDate(candidate.duplicateCreated)}</span>
          </div>
          <Badge variant="outline" className="mt-2 text-xs">
            {candidate.duplicateStatus}
          </Badge>
        </div>
      </div>

      {/* Expand/Collapse for more details */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full mt-3 pt-2 border-t flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        {expanded ? (
          <>
            <ChevronUp className="h-3 w-3" />
            Less details
          </>
        ) : (
          <>
            <ChevronDown className="h-3 w-3" />
            More details
          </>
        )}
      </button>

      {expanded && (
        <div className="mt-3 pt-3 border-t text-xs text-muted-foreground space-y-1">
          <p><strong>Property:</strong> {candidate.primaryProperty}</p>
          <p><strong>Flagged:</strong> {formatDate(candidate.createdAt)}</p>
          <p><strong>Time difference:</strong> {
            Math.round(
              (new Date(candidate.duplicateCreated).getTime() - new Date(candidate.primaryCreated).getTime()) 
              / (1000 * 60 * 60)
            )
          } hours apart</p>
        </div>
      )}
    </Card>
  );
}
