import { useState } from 'react';
import { useMorningQueue } from '../hooks/useMorningQueue';
import { CapacitySummary } from '../components/morning-queue/CapacitySummary';
import { DeadlineGroup } from '../components/morning-queue/DeadlineGroup';
import { WorkOrderGrid } from '../components/work-orders/WorkOrderGrid';
import { LayoutList, Table as TableIcon, RefreshCw, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

type ViewMode = 'grouped' | 'table';

export default function MorningQueuePage() {
  const { items, capacity, grouped, totalExposure, loading, error } = useMorningQueue();
  const [view, setView] = useState<ViewMode>('grouped');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Bulk Actions
  const handleBulkAction = (action: string, itemIds: string[]) => {
    toast.info(`Executing ${action} on ${itemIds.length} items... (Mock)`);
    // Implement API calls here
    if (action === 'reassign') {
        // open modal
    }
    setSelectedIds([]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2">Loading morning queue...</span>
      </div>
    );
  }

  if (error) {
    return <div className="flex items-center justify-center h-full text-red-500">Error: {error.message}</div>;
  }

  return (
    <div className="flex flex-col h-full bg-muted/10">
      {/* Fixed header with capacity */}
      <CapacitySummary 
        availableHours={capacity.availableHours}
        requiredHours={capacity.requiredHours}
        itemCount={items.length}
        totalExposure={totalExposure}
      />
      
      {/* View toggle */}
      <div className="flex justify-between items-center px-6 py-3 border-b bg-card">
        <span className="font-medium">{items.length} items needing attention</span>
        <div className="flex bg-muted p-1 rounded-lg">
            <button
              className={`p-1.5 rounded-md transition-all ${view === 'grouped' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              onClick={() => setView('grouped')}
              title="Grouped View"
            >
              <LayoutList className="h-4 w-4" />
            </button>
            <button
              className={`p-1.5 rounded-md transition-all ${view === 'table' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              onClick={() => setView('table')}
              title="Table View"
            >
              <TableIcon className="h-4 w-4" />
            </button>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto">
            {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center bg-card rounded-lg border border-dashed">
                  <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">All Clear!</h3>
                  <p className="text-muted-foreground max-w-md">
                    No items requiring attention. You are on track.
                  </p>
                </div>
            ) : view === 'grouped' ? (
              <>
                <DeadlineGroup 
                    tier="overdue" 
                    items={grouped.overdue} 
                    selectedIds={selectedIds} 
                    onSelect={(id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
                    onBulkAction={handleBulkAction}
                />
                <DeadlineGroup 
                    tier="due-today" 
                    items={grouped['due-today']} 
                    selectedIds={selectedIds} 
                    onSelect={(id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
                    onBulkAction={handleBulkAction}
                />
                <DeadlineGroup 
                    tier="critical" 
                    items={grouped.critical} 
                    selectedIds={selectedIds} 
                    onSelect={(id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
                    onBulkAction={handleBulkAction}
                />
                <DeadlineGroup 
                    tier="warning" 
                    items={grouped.warning} 
                    selectedIds={selectedIds} 
                    onSelect={(id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
                    onBulkAction={handleBulkAction}
                />
                <DeadlineGroup 
                    tier="watch" 
                    items={grouped.watch} 
                    selectedIds={selectedIds} 
                    onSelect={(id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
                    onBulkAction={handleBulkAction}
                />
                <DeadlineGroup 
                    tier="scheduled" 
                    items={grouped.scheduled} 
                    selectedIds={selectedIds} 
                    onSelect={(id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
                    onBulkAction={handleBulkAction}
                    defaultExpanded={false}
                />
              </>
            ) : (
              <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
                  <WorkOrderGrid 
                    workOrders={items}
                    selectedIds={selectedIds}
                    onSelectionChange={setSelectedIds}
                    onRowClick={(id) => toast.info(`Clicked ${id}`)}
                    sortColumn="deadline"
                    sortDirection="asc"
                    onSort={() => {}}
                    visibleColumns={['checkbox', 'deadline', 'property', 'description', 'assignee', 'status']}
                  />
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
