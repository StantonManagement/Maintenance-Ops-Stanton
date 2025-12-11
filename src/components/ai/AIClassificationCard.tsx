import { useState } from 'react';
import { Sparkles, Clock, Wrench, AlertTriangle, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { AIClassification } from '../../hooks/useAIClassification';

interface AIClassificationCardProps {
  classification: AIClassification | null;
  isClassifying?: boolean;
  onClassify?: () => void;
  onOverridePriority?: (newPriority: string) => void;
  workOrderId?: string;
}

export function AIClassificationCard({
  classification,
  isClassifying = false,
  onClassify,
  onOverridePriority,
}: AIClassificationCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [overrideMode, setOverrideMode] = useState(false);

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'emergency':
        return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-400' };
      case 'high':
        return { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-400' };
      case 'medium':
        return { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-400' };
      case 'low':
        return { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-400' };
      case 'cosmetic':
        return { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-400' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-300' };
    }
  };

  const getCategoryIcon = (category: string): string => {
    switch (category?.toLowerCase()) {
      case 'plumbing': return '🔧';
      case 'electrical': return '⚡';
      case 'hvac': return '❄️';
      case 'appliance': return '🔌';
      case 'structural': return '🏗️';
      case 'doors_windows': return '🚪';
      case 'flooring': return '🪵';
      case 'painting': return '🎨';
      case 'cleaning': return '🧹';
      case 'pest': return '🐛';
      case 'locksmith': return '🔑';
      default: return '🔨';
    }
  };

  // No classification yet - show classify button
  if (!classification) {
    return (
      <Card className="p-4 bg-gray-50 border-dashed">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm">AI Classification</span>
          </div>
          {onClassify && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClassify}
              disabled={isClassifying}
              className="gap-2"
            >
              {isClassifying ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {isClassifying ? 'Classifying...' : 'Classify with AI'}
            </Button>
          )}
        </div>
      </Card>
    );
  }

  const priorityStyle = getPriorityColor(classification.priority);

  return (
    <Card className={`p-4 border-2 ${priorityStyle.border}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-purple-500" />
          <span className="text-sm font-medium">AI Classification</span>
          <Badge variant="outline" className="text-xs">
            {classification.priorityConfidence}% confident
          </Badge>
        </div>
        {onClassify && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClassify}
            disabled={isClassifying}
            className="text-xs"
          >
            {isClassifying ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              'Re-classify'
            )}
          </Button>
        )}
      </div>

      {/* Priority Row */}
      <div className="flex items-center gap-4 mb-3">
        <div className="flex-1">
          <label className="text-xs text-muted-foreground mb-1 block">Priority</label>
          {overrideMode ? (
            <Select
              defaultValue={classification.priority}
              onValueChange={(value) => {
                onOverridePriority?.(value);
                setOverrideMode(false);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="emergency">Emergency</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="cosmetic">Cosmetic</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <div className="flex items-center gap-2">
              <Badge className={`${priorityStyle.bg} ${priorityStyle.text}`}>
                {classification.priority.toUpperCase()}
              </Badge>
              {onOverridePriority && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setOverrideMode(true)}
                  className="text-xs h-6 px-2"
                >
                  Override
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="flex-1">
          <label className="text-xs text-muted-foreground mb-1 block">Category</label>
          <div className="flex items-center gap-2">
            <span className="text-lg">{getCategoryIcon(classification.category)}</span>
            <span className="text-sm font-medium capitalize">{classification.category}</span>
            {classification.subcategory && (
              <span className="text-xs text-muted-foreground">/ {classification.subcategory}</span>
            )}
          </div>
        </div>

        <div className="flex-1">
          <label className="text-xs text-muted-foreground mb-1 block">Time Estimate</label>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{classification.estimatedHours}h</span>
            <span className="text-xs text-muted-foreground">
              ({classification.estimatedHoursConfidence}%)
            </span>
          </div>
        </div>
      </div>

      {/* Reasoning */}
      <div className="mb-3 p-2 bg-gray-50 rounded text-sm">
        <p className="text-gray-700">{classification.priorityReasoning}</p>
      </div>

      {/* Skills */}
      <div className="flex items-center gap-2 mb-3">
        <Wrench className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Skills:</span>
        {classification.skillsRequired.map((skill) => (
          <Badge key={skill} variant="secondary" className="text-xs">
            {skill}
          </Badge>
        ))}
        {classification.certificationRequired && (
          <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">
            Requires: {classification.certificationRequired}
          </Badge>
        )}
      </div>

      {/* Flags */}
      {(classification.flags.safetyConcern || 
        classification.flags.possibleTenantDamage || 
        classification.flags.likelyRecurring || 
        classification.flags.multiVisitLikely) && (
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          {classification.flags.safetyConcern && (
            <Badge variant="destructive" className="text-xs">Safety Concern</Badge>
          )}
          {classification.flags.possibleTenantDamage && (
            <Badge className="text-xs bg-orange-100 text-orange-700">Possible Tenant Damage</Badge>
          )}
          {classification.flags.likelyRecurring && (
            <Badge className="text-xs bg-purple-100 text-purple-700">Recurring Issue</Badge>
          )}
          {classification.flags.multiVisitLikely && (
            <Badge className="text-xs bg-blue-100 text-blue-700">Multi-Visit Likely</Badge>
          )}
        </div>
      )}

      {/* Expand for more details */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full pt-2 border-t flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        {expanded ? (
          <>
            <ChevronUp className="h-3 w-3" />
            Less details
          </>
        ) : (
          <>
            <ChevronDown className="h-3 w-3" />
            Parts & more details
          </>
        )}
      </button>

      {expanded && (
        <div className="mt-3 pt-3 border-t space-y-3">
          {/* Likely Parts */}
          {(classification.likelyParts.highConfidence.length > 0 || 
            classification.likelyParts.bringJustInCase.length > 0) && (
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">
                Suggested Parts
              </label>
              {classification.likelyParts.highConfidence.length > 0 && (
                <div className="mb-2">
                  <span className="text-xs text-green-600 font-medium">Likely needed:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {classification.likelyParts.highConfidence.map((part, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {part}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {classification.likelyParts.bringJustInCase.length > 0 && (
                <div>
                  <span className="text-xs text-muted-foreground">Bring just in case:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {classification.likelyParts.bringJustInCase.map((part, i) => (
                      <Badge key={i} variant="outline" className="text-xs text-muted-foreground">
                        ? {part}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Time Factors */}
          {classification.timeFactors.length > 0 && (
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Time Factors
              </label>
              <ul className="text-xs text-muted-foreground list-disc list-inside">
                {classification.timeFactors.map((factor, i) => (
                  <li key={i}>{factor}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
