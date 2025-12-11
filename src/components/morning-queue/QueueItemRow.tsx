import { WorkOrderRow, WorkOrderWithExtras } from '@/components/work-orders/WorkOrderRow';

interface QueueItemRowProps {
  item: WorkOrderWithExtras;
  selected: boolean;
  onSelect: () => void;
  onClick: () => void;
}

export function QueueItemRow({ item, selected, onSelect, onClick }: QueueItemRowProps) {
  return (
    <WorkOrderRow 
      workOrder={item} 
      selected={selected} 
      onSelect={onSelect} 
      onClick={onClick}
      visibleColumns={['deadline', 'property', 'description', 'category', 'assignee', 'status']}
    />
  );
}
