import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, X, AlertTriangle, Clock, MessageSquare, UserX } from "lucide-react";
import { cn } from "@/lib/utils";

interface WorkOrderFiltersProps {
  filters: {
    search: string;
    status: string[];
    priority: string[];
    quickFilters: string[];
  };
  onChange: (filters: { search: string; status: string[]; priority: string[]; quickFilters: string[] }) => void;
}

// Quick filter definitions
const QUICK_FILTERS = [
  { id: 'emergency', label: 'Emergency', icon: AlertTriangle, color: 'text-red-600 bg-red-50 border-red-200 hover:bg-red-100' },
  { id: 'today', label: "Today's Schedule", icon: Clock, color: 'text-blue-600 bg-blue-50 border-blue-200 hover:bg-blue-100' },
  { id: 'unread', label: 'Unread Messages', icon: MessageSquare, color: 'text-amber-600 bg-amber-50 border-amber-200 hover:bg-amber-100' },
  { id: 'unassigned', label: 'Needs Assignment', icon: UserX, color: 'text-purple-600 bg-purple-50 border-purple-200 hover:bg-purple-100' },
];

// Status filter options
const STATUS_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'waiting_parts', label: 'Waiting Parts' },
  { value: 'waiting_access', label: 'Waiting Access' },
  { value: 'ready_review', label: 'Ready for Review' },
  { value: 'completed', label: 'Completed' },
];

export function WorkOrderFilters({ filters, onChange }: WorkOrderFiltersProps) {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...filters, search: e.target.value });
  };

  const toggleQuickFilter = (filterId: string) => {
    const current = filters.quickFilters || [];
    const updated = current.includes(filterId)
      ? current.filter(f => f !== filterId)
      : [...current, filterId];
    onChange({ ...filters, quickFilters: updated });
  };

  const toggleStatusFilter = (status: string) => {
    const current = filters.status || [];
    const updated = current.includes(status)
      ? current.filter(s => s !== status)
      : [...current, status];
    onChange({ ...filters, status: updated });
  };

  const clearAllFilters = () => {
    onChange({ search: '', status: [], priority: [], quickFilters: [] });
  };

  const hasActiveFilters = filters.search || 
    (filters.status && filters.status.length > 0) || 
    (filters.priority && filters.priority.length > 0) ||
    (filters.quickFilters && filters.quickFilters.length > 0);

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search..."
            className="w-full pl-8 h-9"
            value={filters.search}
            onChange={handleSearchChange}
          />
        </div>

        {/* Quick Filter Chips */}
        <div className="flex items-center gap-2">
          {QUICK_FILTERS.map((filter) => {
            const isActive = (filters.quickFilters || []).includes(filter.id);
            const Icon = filter.icon;
            return (
              <button
                key={filter.id}
                onClick={() => toggleQuickFilter(filter.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                  isActive 
                    ? filter.color + " ring-2 ring-offset-1 ring-current/20"
                    : "text-muted-foreground bg-muted/50 border-transparent hover:bg-muted"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {filter.label}
              </button>
            );
          })}
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearAllFilters}
            className="h-8 px-2 text-muted-foreground"
          >
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Status Filter Row (shown when expanded or has active status filters) */}
      {(filters.status && filters.status.length > 0) && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">Status:</span>
          {filters.status.map(status => {
            const option = STATUS_OPTIONS.find(o => o.value === status);
            return (
              <Badge 
                key={status} 
                variant="secondary" 
                className="cursor-pointer hover:bg-destructive/10"
                onClick={() => toggleStatusFilter(status)}
              >
                {option?.label || status}
                <X className="h-3 w-3 ml-1" />
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}
