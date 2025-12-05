import { useState } from 'react';
import { VoiceSubmission } from '../../services/voiceService';
import { ConfidenceIndicator, ConfidenceBadge } from './ConfidenceIndicator';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { 
  Mic, 
  Globe, 
  Clock, 
  CheckCircle, 
  X, 
  Edit2, 
  Volume2,
  MessageSquare,
  Phone,
  Send as TelegramIcon
} from 'lucide-react';

interface VoiceWorkOrderDraftProps {
  submission: VoiceSubmission;
  onCreateWorkOrder: (data: {
    property: string;
    unit: string;
    description: string;
    priority: string;
    category: string;
  }) => Promise<{ success: boolean; workOrderId?: string; error?: string }>;
  onDiscard: () => void;
}

export function VoiceWorkOrderDraft({ submission, onCreateWorkOrder, onDiscard }: VoiceWorkOrderDraftProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Editable fields
  const [property, setProperty] = useState(submission.extracted_data.property?.value || '');
  const [unit, setUnit] = useState(submission.extracted_data.unit?.value || '');
  const [description, setDescription] = useState(submission.extracted_data.issue_description?.value || submission.transcription);
  const [priority, setPriority] = useState(submission.extracted_data.priority?.value || 'normal');
  const [category, setCategory] = useState(submission.extracted_data.category?.value || 'General');

  const getSourceIcon = () => {
    switch (submission.source) {
      case 'twilio': return <Phone size={14} />;
      case 'telegram': return <TelegramIcon size={14} />;
      case 'voicemail': return <MessageSquare size={14} />;
      default: return <Mic size={14} />;
    }
  };

  const getSourceLabel = () => {
    switch (submission.source) {
      case 'twilio': return 'Phone Call';
      case 'telegram': return 'Telegram';
      case 'voicemail': return 'Voicemail';
      default: return 'Voice';
    }
  };

  const getLanguageLabel = (code: string) => {
    const languages: Record<string, string> = {
      'en': 'English',
      'es': 'Spanish',
      'zh': 'Chinese',
      'pt': 'Portuguese',
      'fr': 'French',
    };
    return languages[code] || code.toUpperCase();
  };

  const getOverallConfidence = () => {
    const fields = [
      submission.extracted_data.property?.confidence || 0,
      submission.extracted_data.unit?.confidence || 0,
      submission.extracted_data.issue_description?.confidence || 0,
      submission.extracted_data.priority?.confidence || 0,
    ];
    const validFields = fields.filter(f => f > 0);
    if (validFields.length === 0) return 0;
    return Math.round(validFields.reduce((a, b) => a + b, 0) / validFields.length);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const result = await onCreateWorkOrder({
        property,
        unit,
        description,
        priority,
        category
      });
      if (!result.success) {
        console.error('Failed to create work order:', result.error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const timeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div 
              className="p-2 rounded-lg"
              style={{ backgroundColor: 'var(--action-primary-light)' }}
            >
              <Mic size={20} style={{ color: 'var(--action-primary)' }} />
            </div>
            <div>
              <CardTitle className="text-base">Voice Submission</CardTitle>
              <div className="flex items-center gap-2 mt-1 text-xs" style={{ color: 'var(--text-secondary)' }}>
                <span className="flex items-center gap-1">
                  {getSourceIcon()}
                  {getSourceLabel()}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Globe size={12} />
                  {getLanguageLabel(submission.detected_language)}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  {timeAgo(submission.created_at)}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              Overall: <ConfidenceBadge confidence={getOverallConfidence()} />
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Transcription */}
        <div 
          className="p-3 rounded-lg border"
          style={{ 
            backgroundColor: 'var(--bg-secondary)', 
            borderColor: 'var(--border-default)' 
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
              Original Transcription
            </span>
            <Button variant="ghost" size="sm" className="h-6 px-2">
              <Volume2 size={14} className="mr-1" />
              Play
            </Button>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
            "{submission.transcription}"
          </p>
        </div>

        {/* Extracted Fields */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Extracted Information
            </span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsEditing(!isEditing)}
              className="h-7"
            >
              <Edit2 size={14} className="mr-1" />
              {isEditing ? 'Done Editing' : 'Edit'}
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Property */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Label className="text-xs">Property</Label>
                <ConfidenceIndicator 
                  confidence={submission.extracted_data.property?.confidence || 0} 
                  fieldName="property"
                />
              </div>
              {isEditing ? (
                <Input 
                  value={property} 
                  onChange={(e) => setProperty(e.target.value)}
                  placeholder="Enter property"
                  className="h-8 text-sm"
                />
              ) : (
                <p className="text-sm" style={{ color: property ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                  {property || 'Not detected'}
                </p>
              )}
            </div>

            {/* Unit */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Label className="text-xs">Unit</Label>
                <ConfidenceIndicator 
                  confidence={submission.extracted_data.unit?.confidence || 0} 
                  fieldName="unit"
                />
              </div>
              {isEditing ? (
                <Input 
                  value={unit} 
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="Enter unit"
                  className="h-8 text-sm"
                />
              ) : (
                <p className="text-sm" style={{ color: unit ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                  {unit || 'Not detected'}
                </p>
              )}
            </div>

            {/* Priority */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Label className="text-xs">Priority</Label>
                <ConfidenceIndicator 
                  confidence={submission.extracted_data.priority?.confidence || 0} 
                  fieldName="priority"
                />
              </div>
              {isEditing ? (
                <Select value={priority} onValueChange={(v) => setPriority(v as typeof priority)}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="emergency">Emergency</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Badge 
                  variant={priority === 'emergency' ? 'destructive' : priority === 'high' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {priority.charAt(0).toUpperCase() + priority.slice(1)}
                </Badge>
              )}
            </div>

            {/* Category */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Label className="text-xs">Category</Label>
                <ConfidenceIndicator 
                  confidence={submission.extracted_data.category?.confidence || 0} 
                  fieldName="category"
                />
              </div>
              {isEditing ? (
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Plumbing">Plumbing</SelectItem>
                    <SelectItem value="Electrical">Electrical</SelectItem>
                    <SelectItem value="HVAC">HVAC</SelectItem>
                    <SelectItem value="Appliance">Appliance</SelectItem>
                    <SelectItem value="Doors/Windows">Doors/Windows</SelectItem>
                    <SelectItem value="General">General</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                  {category}
                </p>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Label className="text-xs">Issue Description</Label>
              <ConfidenceIndicator 
                confidence={submission.extracted_data.issue_description?.confidence || 0} 
                fieldName="description"
              />
            </div>
            {isEditing ? (
              <Textarea 
                value={description} 
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter description"
                className="text-sm min-h-[80px]"
              />
            ) : (
              <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t" style={{ borderColor: 'var(--border-default)' }}>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onDiscard}
            disabled={isSubmitting}
          >
            <X size={14} className="mr-1" />
            Discard
          </Button>
          <Button 
            size="sm"
            onClick={handleSubmit}
            disabled={isSubmitting || !property || !unit || !description}
          >
            <CheckCircle size={14} className="mr-1" />
            {isSubmitting ? 'Creating...' : 'Create Work Order'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
