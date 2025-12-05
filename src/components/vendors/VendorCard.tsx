import { Vendor } from '../../hooks/useVendors';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { 
  Phone, 
  Mail, 
  Star, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Zap,
  Award
} from 'lucide-react';

interface VendorCardProps {
  vendor: Vendor;
  onSelect?: () => void;
  onViewDetails?: () => void;
  selected?: boolean;
  compact?: boolean;
}

export function VendorCard({ vendor, onSelect, onViewDetails, selected, compact }: VendorCardProps) {
  const formatResponseTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    if (minutes < 1440) return `${Math.round(minutes / 60)} hr`;
    return `${Math.round(minutes / 1440)} day`;
  };

  const getQualityColor = (score: number) => {
    if (score >= 90) return 'var(--status-success-text)';
    if (score >= 75) return 'var(--status-warning-text)';
    return 'var(--status-critical-text)';
  };

  if (compact) {
    return (
      <div 
        className={`p-3 rounded-lg border cursor-pointer transition-all ${selected ? 'ring-2' : ''}`}
        style={{ 
          backgroundColor: selected ? 'var(--action-primary-light)' : 'var(--bg-card)',
          borderColor: selected ? 'var(--action-primary)' : 'var(--border-default)'
        }}
        onClick={onSelect}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium"
              style={{ backgroundColor: 'var(--action-primary)', color: 'white' }}
            >
              {vendor.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {vendor.name}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                {vendor.company}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {vendor.emergency_available && (
              <Zap size={14} style={{ color: 'var(--status-warning-text)' }} />
            )}
            <span className="text-sm font-medium" style={{ color: getQualityColor(vendor.quality_score) }}>
              {vendor.quality_score}%
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-medium"
              style={{ backgroundColor: 'var(--action-primary)', color: 'white' }}
            >
              {vendor.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                {vendor.name}
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {vendor.company}
              </p>
            </div>
          </div>
          {vendor.emergency_available && (
            <Badge variant="outline" className="text-xs" style={{ borderColor: 'var(--status-warning-border)', color: 'var(--status-warning-text)' }}>
              <Zap size={12} className="mr-1" />
              24/7
            </Badge>
          )}
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-1 mb-3">
          {vendor.categories.map(cat => (
            <Badge key={cat} variant="secondary" className="text-xs">
              {cat}
            </Badge>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="text-center p-2 rounded" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <div className="flex items-center justify-center gap-1 mb-1">
              <Star size={12} style={{ color: getQualityColor(vendor.quality_score) }} />
              <span className="text-sm font-semibold" style={{ color: getQualityColor(vendor.quality_score) }}>
                {vendor.quality_score}%
              </span>
            </div>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Quality</p>
          </div>
          <div className="text-center p-2 rounded" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <div className="flex items-center justify-center gap-1 mb-1">
              <Clock size={12} style={{ color: 'var(--text-secondary)' }} />
              <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                {formatResponseTime(vendor.response_time_avg)}
              </span>
            </div>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Avg Response</p>
          </div>
          <div className="text-center p-2 rounded" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <div className="flex items-center justify-center gap-1 mb-1">
              <CheckCircle size={12} style={{ color: 'var(--text-secondary)' }} />
              <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                {vendor.jobs_completed}
              </span>
            </div>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Jobs Done</p>
          </div>
        </div>

        {/* Certifications */}
        {vendor.certifications.length > 0 && (
          <div className="flex items-center gap-1 mb-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
            <Award size={12} />
            {vendor.certifications.slice(0, 2).join(', ')}
            {vendor.certifications.length > 2 && ` +${vendor.certifications.length - 2}`}
          </div>
        )}

        {/* Contact & Rate */}
        <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: 'var(--border-default)' }}>
          <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
            <span className="flex items-center gap-1">
              <Phone size={12} />
              {vendor.phone}
            </span>
          </div>
          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            ${vendor.hourly_rate}/hr
          </span>
        </div>

        {/* Actions */}
        {(onSelect || onViewDetails) && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t" style={{ borderColor: 'var(--border-default)' }}>
            {onViewDetails && (
              <Button variant="outline" size="sm" className="flex-1" onClick={onViewDetails}>
                View Details
              </Button>
            )}
            {onSelect && (
              <Button size="sm" className="flex-1" onClick={onSelect}>
                Select Vendor
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
