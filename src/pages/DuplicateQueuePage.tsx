import { useState } from 'react';
import { GitMerge, X, RefreshCw, CheckSquare, AlertTriangle, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useDuplicateCandidates, DuplicateCandidate } from '../hooks/useDuplicateCandidates';
import { useAIDuplicateAnalysis } from '../hooks/useAIDuplicateAnalysis';
import { DuplicatePairCard } from '../components/duplicates/DuplicatePairCard';
import { toast } from 'sonner';

export default function DuplicateQueuePage() {
  const {
    candidates,
    loading,
    error,
    refetch,
    mergeCandidate,
    dismissCandidate,
    bulkMerge,
    bulkDismiss,
  } = useDuplicateCandidates();

  const {
    analyzing,
    bulkAnalyzing,
    analyzeCandidate,
    bulkAnalyze,
  } = useAIDuplicateAnalysis();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const handleSelect = (id: string, selected: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (selected) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === candidates.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(candidates.map(c => c.id)));
    }
  };

  const handleBulkMerge = async () => {
    await bulkMerge(Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  const handleBulkDismiss = async () => {
    await bulkDismiss(Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  const handleAnalyze = async (candidate: DuplicateCandidate) => {
    const result = await analyzeCandidate(candidate);
    if (result) {
      toast.success(`AI Analysis: ${result.recommendation} (${result.confidence}% confident)`);
      refetch(); // Refresh to show updated AI data
    }
  };

  const handleBulkAnalyze = async () => {
    const unanalyzed = candidates.filter(c => !c.aiAnalyzedAt);
    if (unanalyzed.length === 0) {
      toast.info('All candidates already analyzed');
      return;
    }
    toast.info(`Analyzing ${unanalyzed.length} candidates...`);
    await bulkAnalyze(unanalyzed);
    toast.success('AI analysis complete');
    refetch();
  };

  const urgentCount = candidates.filter(c => c.hoursPending > 24).length;
  const highConfidenceCount = candidates.filter(c => c.confidenceScore >= 0.85).length;
  const aiMergeCount = candidates.filter(c => c.aiRecommendation === 'MERGE').length;
  const unanalyzedCount = candidates.filter(c => !c.aiAnalyzedAt).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2">Loading duplicate candidates...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-muted/10">
      {/* Header */}
      <div className="h-14 border-b bg-card px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="font-semibold text-lg">Duplicate Detection Queue</h2>
          <Badge variant="secondary" className="gap-1">
            <GitMerge className="h-3 w-3" />
            {candidates.length} pending
          </Badge>
          {urgentCount > 0 && (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="h-3 w-3" />
              {urgentCount} urgent
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {unanalyzedCount > 0 && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleBulkAnalyze}
              disabled={bulkAnalyzing}
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" />
              {bulkAnalyzing ? 'Analyzing...' : `Analyze All (${unanalyzedCount})`}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={refetch} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Bar */}
      {candidates.length > 0 && (
        <div className="px-6 py-3 bg-card border-b flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm">
            {aiMergeCount > 0 && (
              <span className="text-muted-foreground">
                <strong className="text-green-600">{aiMergeCount}</strong> AI recommends merge
              </span>
            )}
            <span className="text-muted-foreground">
              <strong className="text-green-600">{highConfidenceCount}</strong> high confidence (≥85%)
            </span>
            <span className="text-muted-foreground">
              <strong className="text-yellow-600">{candidates.length - highConfidenceCount}</strong> needs review
            </span>
          </div>

          {/* Bulk Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSelectAll}
              className="gap-1"
            >
              <CheckSquare className="h-4 w-4" />
              {selectedIds.size === candidates.length ? 'Deselect All' : 'Select All'}
            </Button>
            
            {selectedIds.size > 0 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkDismiss}
                  className="gap-1"
                >
                  <X className="h-4 w-4" />
                  Dismiss ({selectedIds.size})
                </Button>
                <Button
                  size="sm"
                  onClick={handleBulkMerge}
                  className="gap-1 bg-green-600 hover:bg-green-700"
                >
                  <GitMerge className="h-4 w-4" />
                  Merge ({selectedIds.size})
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            Error loading duplicates: {error.message}
          </div>
        )}

        {candidates.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <GitMerge className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-medium mb-2">No Duplicates Detected</h3>
            <p className="text-muted-foreground max-w-md">
              The system automatically scans for potential duplicate work orders. 
              When duplicates are found, they'll appear here for your review.
            </p>
          </div>
        ) : (
          <div className="space-y-4 max-w-4xl mx-auto">
            {candidates.map(candidate => (
              <DuplicatePairCard
                key={candidate.id}
                candidate={candidate}
                onMerge={mergeCandidate}
                onDismiss={dismissCandidate}
                onAnalyze={handleAnalyze}
                isAnalyzing={analyzing === candidate.id}
                isSelected={selectedIds.has(candidate.id)}
                onSelect={handleSelect}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
