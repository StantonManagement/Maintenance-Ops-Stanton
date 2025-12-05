import { useState } from 'react';
import { WorkOrder } from '../../types';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Search, GripVertical } from 'lucide-react';
import { Input } from '../ui/input';

interface UnscheduledQueueProps {
  workOrders: WorkOrder[];
}

export function UnscheduledQueue({ workOrders }: UnscheduledQueueProps) {
  const [filter, setFilter] = useState('');

  const filteredOrders = workOrders.filter(wo => 
    wo.title.toLowerCase().includes(filter.toLowerCase()) ||
    wo.propertyAddress.toLowerCase().includes(filter.toLowerCase())
  );

  const handleDragStart = (e: React.DragEvent, workOrder: WorkOrder) => {
    // Set data for both internal logic and react-big-calendar
    e.dataTransfer.setData('workOrderId', workOrder.id);
    e.dataTransfer.setData('application/json', JSON.stringify(workOrder));
    e.dataTransfer.effectAllowed = 'move';
    
    // Styling for the drag image
    const dragPreview = document.createElement('div');
    dragPreview.innerHTML = workOrder.title;
    dragPreview.style.padding = '8px';
    dragPreview.style.background = 'white';
    dragPreview.style.border = '1px solid #ccc';
    dragPreview.style.borderRadius = '4px';
    document.body.appendChild(dragPreview);
    e.dataTransfer.setDragImage(dragPreview, 0, 0);
    setTimeout(() => document.body.removeChild(dragPreview), 0);
  };

  return (
    <div className="flex flex-col h-full border-r bg-card">
      <div className="p-4 border-b space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Unscheduled</h3>
          <Badge variant="secondary">{filteredOrders.length}</Badge>
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search orders..." 
            className="pl-8"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-3">
          {filteredOrders.map((wo) => (
            <div
              key={wo.id}
              draggable
              onDragStart={(e) => handleDragStart(e, wo)}
              className="p-3 bg-white border rounded-md shadow-sm cursor-move hover:shadow-md transition-all group"
              style={{
                borderLeft: `4px solid ${getPriorityColor(wo.priority)}`
              }}
            >
              <div className="flex items-start gap-2">
                <GripVertical className="h-4 w-4 text-muted-foreground mt-1 opacity-50 group-hover:opacity-100" />
                <div className="flex-1 overflow-hidden">
                  <div className="text-sm font-medium truncate">{wo.title}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {wo.propertyCode} · {wo.residentName}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-[10px] h-5">
                      {wo.priority}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">2h est.</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

function getPriorityColor(priority: string) {
  switch (priority) {
    case 'emergency': return '#ef4444';
    case 'high': return '#f59e0b';
    case 'normal': return '#3b82f6';
    case 'low': return '#10b981';
    default: return '#94a3b8';
  }
}
