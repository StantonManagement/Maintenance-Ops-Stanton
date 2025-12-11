import { WorkOrderRow, WorkOrderWithExtras } from './WorkOrderRow';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface WorkOrderGridProps {
  workOrders: WorkOrderWithExtras[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onRowClick: (id: string) => void;
  sortColumn: string;
  sortDirection: 'asc' | 'desc';
  onSort: (column: string) => void;
  visibleColumns: string[];
  onAssign?: (workOrderId: string) => void;
  onChangeStatus?: (workOrderId: string) => void;
}

export function WorkOrderGrid({
  workOrders,
  selectedIds,
  onSelectionChange,
  onRowClick,
  sortColumn,
  sortDirection,
  onSort,
  visibleColumns,
  onAssign,
  onChangeStatus
}: WorkOrderGridProps) {
  
  const allSelected = workOrders.length > 0 && selectedIds.length === workOrders.length;
  const isIndeterminate = selectedIds.length > 0 && selectedIds.length < workOrders.length;

  const toggleAll = () => {
    if (allSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(workOrders.map(wo => wo.id));
    }
  };

  const toggleSelection = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter(sid => sid !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (sortColumn !== column) return null;
    return sortDirection === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />;
  };

  const showColumn = (col: string) => visibleColumns.includes(col);

  return (
    <div className="w-full overflow-auto rounded-md border">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-secondary/20 border-b backdrop-blur-sm z-10">
          <tr className="text-left font-medium text-muted-foreground">
            <th className="w-10 px-4 py-3">
              <Checkbox 
                checked={allSelected || (isIndeterminate ? 'indeterminate' : false)} 
                onCheckedChange={toggleAll} 
              />
            </th>
            
            {showColumn('deadline') && (
              <th className="px-4 py-3 cursor-pointer hover:text-foreground" onClick={() => onSort('deadline')}>
                <div className="flex items-center">
                  Deadline <SortIcon column="deadline" />
                </div>
              </th>
            )}
            
            {showColumn('id') && (
              <th className="px-4 py-3 cursor-pointer hover:text-foreground" onClick={() => onSort('id')}>
                <div className="flex items-center">
                  ID <SortIcon column="id" />
                </div>
              </th>
            )}

            {showColumn('status') && (
              <th className="px-4 py-3 cursor-pointer hover:text-foreground" onClick={() => onSort('status')}>
                <div className="flex items-center">
                  Status <SortIcon column="status" />
                </div>
              </th>
            )}

            {showColumn('property') && (
              <th className="px-4 py-3 cursor-pointer hover:text-foreground" onClick={() => onSort('property')}>
                <div className="flex items-center">
                  Property <SortIcon column="property" />
                </div>
              </th>
            )}

            {showColumn('description') && (
              <th className="px-4 py-3 cursor-pointer hover:text-foreground" onClick={() => onSort('description')}>
                <div className="flex items-center">
                  Description <SortIcon column="description" />
                </div>
              </th>
            )}

            {showColumn('assignee') && (
              <th className="px-4 py-3 cursor-pointer hover:text-foreground" onClick={() => onSort('assignee')}>
                <div className="flex items-center">
                  Assignee <SortIcon column="assignee" />
                </div>
              </th>
            )}

            {showColumn('category') && (
              <th className="px-4 py-3 cursor-pointer hover:text-foreground" onClick={() => onSort('category')}>
                <div className="flex items-center">
                  Category <SortIcon column="category" />
                </div>
              </th>
            )}

            {showColumn('created') && (
              <th className="px-4 py-3 cursor-pointer hover:text-foreground" onClick={() => onSort('created')}>
                <div className="flex items-center">
                  Created <SortIcon column="created" />
                </div>
              </th>
            )}

            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {workOrders.length === 0 ? (
            <tr>
              <td colSpan={visibleColumns.length + 2} className="px-4 py-12 text-center text-muted-foreground">
                No work orders found
              </td>
            </tr>
          ) : (
            workOrders.map(wo => (
              <WorkOrderRow 
                key={wo.id} 
                workOrder={wo as WorkOrderWithExtras}
                selected={selectedIds.includes(wo.id)}
                onSelect={() => toggleSelection(wo.id)}
                onClick={() => onRowClick(wo.id)}
                visibleColumns={visibleColumns}
                onAssign={onAssign}
                onChangeStatus={onChangeStatus}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
