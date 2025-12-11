# PRP-05: Approval Queue Quick Mode

## Goal
Speed up the approval workflow by showing before/after photos inline, enabling one-click approvals without opening a full detail view. The coordinator should be able to approve 20 items in 5 minutes, not 20 minutes.

## Success Criteria
- [ ] Each queue item shows before/after photo thumbnails inline
- [ ] One-click "Approve" button on each row
- [ ] "Reject" opens a quick reason input (not full page)
- [ ] Detail expansion only needed for edge cases
- [ ] Keyboard shortcuts for power users (A = approve, R = reject)
- [ ] Maintains audit trail for all decisions

## Dependencies
- PRP-01 (DeadlineCountdown component) - for showing deadline context

## Context

### Current Problem (from UX Audit)
- "Inline Before/After photo comparison in the list view itself (thumbnail) to allow 1-second approvals without opening full detail"
- Currently requires opening each item to see photos and approve

### Coordinator's Workflow
1. Look at photos - does work look done?
2. Look at cleanup - is area clean?
3. Approve or reject with reason
4. Move to next item

This should take 10-15 seconds per item, not 60+ seconds.

## Implementation Tasks

### Task 1: Quick Review Card Component

CREATE `src/components/approval-queue/QuickReviewCard.tsx`:

```typescript
interface QuickReviewCardProps {
  workOrder: WorkOrderForApproval;
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
  onExpand: (id: string) => void;
  focused?: boolean;
}

interface WorkOrderForApproval {
  id: string;
  description: string;
  propertyCode: string;
  unitNumber: string;
  technicianName: string;
  completedAt: Date;
  deadline: Date;
  photos: {
    before: string[];  // URLs
    after: string[];
    cleanup: string[];
  };
  techNotes?: string;
}
```

### Task 2: Card Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│  S0021-67 Park - Unit 302                              [Expand ↗]      │
│  Ceiling leak repair                                                    │
│  Tech: Ramon | Completed: 2 hours ago | Due: 3 days                    │
│                                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│  │              │  │              │  │              │                  │
│  │    BEFORE    │  │    AFTER     │  │   CLEANUP    │                  │
│  │              │  │              │  │              │                  │
│  │  [photo]     │  │  [photo]     │  │  [photo]     │                  │
│  │              │  │              │  │              │                  │
│  └──────────────┘  └──────────────┘  └──────────────┘                  │
│                                                                         │
│  Tech notes: "Replaced drywall section, painted to match"              │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │   [✓ Approve]                              [✗ Reject]           │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

Photo thumbnails: 150x150px, click to enlarge in lightbox

### Task 3: Photo Thumbnail Grid

CREATE `src/components/approval-queue/PhotoThumbnailGrid.tsx`:

```typescript
interface PhotoThumbnailGridProps {
  before: string[];
  after: string[];
  cleanup: string[];
  onPhotoClick: (url: string, category: string) => void;
}
```

Layout: 3 columns (Before | After | Cleanup)
- Show first photo from each category as thumbnail
- Badge showing "+2" if more photos in category
- Click thumbnail → opens lightbox with all photos in that category
- If no photos in category, show placeholder

### Task 4: Quick Reject Modal

CREATE `src/components/approval-queue/QuickRejectModal.tsx`:

```typescript
interface QuickRejectModalProps {
  workOrderId: string;
  isOpen: boolean;
  onClose: () => void;
  onReject: (reason: string) => void;
}
```

Minimal modal:
```
┌────────────────────────────────────────┐
│  Reject Work Order                  ✕  │
├────────────────────────────────────────┤
│                                        │
│  Reason:                               │
│  ○ Work incomplete                     │
│  ○ Quality issues                      │
│  ○ Missing photos                      │
│  ○ Cleanup not done                    │
│  ○ Other: [________________]           │
│                                        │
│  Notes (optional):                     │
│  [____________________________]        │
│                                        │
│        [Cancel]  [Reject & Return]     │
└────────────────────────────────────────┘
```

Pre-defined reasons for speed, "Other" for edge cases.

### Task 5: Photo Lightbox

CREATE `src/components/ui/PhotoLightbox.tsx`:

```typescript
interface PhotoLightboxProps {
  photos: string[];
  initialIndex: number;
  category: string;  // "Before" | "After" | "Cleanup"
  isOpen: boolean;
  onClose: () => void;
}
```

Features:
- Full-screen overlay
- Arrow keys / swipe to navigate
- Shows category label
- Shows "1 of 3" counter
- ESC or click outside to close
- Zoom on click (optional)

### Task 6: Approval Queue Page Refactor

MODIFY `src/pages/ApprovalQueue.tsx`:

```tsx
export function ApprovalQueuePage() {
  const { items, loading, refetch } = useApprovalQueue();
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<LightboxState | null>(null);
  
  const handleApprove = async (id: string) => {
    await approveWorkOrder(id);
    toast.success('Work order approved');
    refetch();
    // Auto-advance to next item
    if (focusedIndex < items.length - 1) {
      setFocusedIndex(f => f + 1);
    }
  };
  
  const handleReject = async (id: string, reason: string) => {
    await rejectWorkOrder(id, reason);
    toast.info('Work order returned for rework');
    setRejectingId(null);
    refetch();
  };
  
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b flex justify-between items-center">
        <div>
          <h1 className="text-lg font-semibold">Approval Queue</h1>
          <p className="text-sm text-gray-500">
            {items.length} items awaiting review
          </p>
        </div>
        <div className="text-sm text-gray-500">
          Shortcuts: A = Approve, R = Reject, ↑↓ = Navigate
        </div>
      </div>
      
      {/* Queue list */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {items.map((item, index) => (
          <QuickReviewCard
            key={item.id}
            workOrder={item}
            focused={index === focusedIndex}
            onApprove={handleApprove}
            onReject={(id) => setRejectingId(id)}
            onExpand={setExpandedId}
            onPhotoClick={(url, category) => setLightbox({ photos: item.photos[category], url, category })}
          />
        ))}
        
        {items.length === 0 && (
          <EmptyState 
            icon={CheckCircle}
            title="All caught up!"
            description="No work orders awaiting approval"
          />
        )}
      </div>
      
      {/* Reject modal */}
      <QuickRejectModal
        workOrderId={rejectingId}
        isOpen={!!rejectingId}
        onClose={() => setRejectingId(null)}
        onReject={(reason) => handleReject(rejectingId!, reason)}
      />
      
      {/* Photo lightbox */}
      {lightbox && (
        <PhotoLightbox
          photos={lightbox.photos}
          initialIndex={lightbox.photos.indexOf(lightbox.url)}
          category={lightbox.category}
          isOpen={true}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  );
}
```

### Task 7: Keyboard Navigation Hook

CREATE `src/hooks/useApprovalKeyboard.ts`:

```typescript
interface UseApprovalKeyboardOptions {
  items: WorkOrderForApproval[];
  focusedIndex: number;
  onFocusChange: (index: number) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onExpand: (id: string) => void;
}

function useApprovalKeyboard(options: UseApprovalKeyboardOptions) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      const currentItem = options.items[options.focusedIndex];
      
      switch (e.key) {
        case 'ArrowUp':
        case 'k':
          e.preventDefault();
          options.onFocusChange(Math.max(0, options.focusedIndex - 1));
          break;
        case 'ArrowDown':
        case 'j':
          e.preventDefault();
          options.onFocusChange(Math.min(options.items.length - 1, options.focusedIndex + 1));
          break;
        case 'a':
        case 'A':
          e.preventDefault();
          if (currentItem) options.onApprove(currentItem.id);
          break;
        case 'r':
        case 'R':
          e.preventDefault();
          if (currentItem) options.onReject(currentItem.id);
          break;
        case 'Enter':
        case 'e':
          e.preventDefault();
          if (currentItem) options.onExpand(currentItem.id);
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [options]);
}
```

### Task 8: Auto-Scroll to Focused Item

When focus changes via keyboard, scroll the focused card into view:

```typescript
const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

useEffect(() => {
  const currentItem = items[focusedIndex];
  if (currentItem) {
    const card = cardRefs.current.get(currentItem.id);
    card?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}, [focusedIndex]);
```

### Task 9: Optimistic UI Updates

When approving:
1. Immediately remove item from list (optimistic)
2. Show success toast
3. Call API in background
4. If API fails, re-add item and show error

```typescript
const handleApprove = async (id: string) => {
  // Optimistic update
  const itemIndex = items.findIndex(i => i.id === id);
  const item = items[itemIndex];
  setItems(items.filter(i => i.id !== id));
  
  try {
    await api.approveWorkOrder(id);
    toast.success('Approved');
  } catch (error) {
    // Revert
    setItems(prev => {
      const newItems = [...prev];
      newItems.splice(itemIndex, 0, item);
      return newItems;
    });
    toast.error('Failed to approve - please try again');
  }
};
```

### Task 10: Stats Header

Add quick stats at top:

```typescript
<div className="flex gap-6 text-sm">
  <span>
    <strong>{items.length}</strong> pending
  </span>
  <span className="text-green-600">
    <strong>{approvedToday}</strong> approved today
  </span>
  <span className="text-amber-600">
    <strong>{rejectedToday}</strong> returned today
  </span>
  <span className="text-red-600">
    <strong>{overdueCount}</strong> overdue
  </span>
</div>
```

## Validation Checkpoints

### Checkpoint 1: Cards Render with Photos
```bash
npm run dev
# Navigate to /approval-queue
# Verify: Cards show with photo thumbnails
# Verify: Before/After/Cleanup columns visible
```

### Checkpoint 2: Photo Lightbox Works
- Click thumbnail → lightbox opens
- Arrow keys navigate photos
- ESC closes
- Category label shows

### Checkpoint 3: Quick Approve Works
- Click Approve button
- Item disappears from list
- Toast shows success
- Next item auto-focuses (if using keyboard flow)

### Checkpoint 4: Quick Reject Works
- Click Reject button
- Modal appears with reasons
- Select reason, click Reject
- Item disappears, toast shows
- Work order status updates to "failed_review"

### Checkpoint 5: Keyboard Navigation Works
- ↑/↓ moves focus between cards
- A approves focused item
- R opens reject modal for focused item
- E expands detail (if implemented)

### Checkpoint 6: Empty State
- Approve all items
- "All caught up!" message shows
- Celebratory moment

### Checkpoint 7: Build Passes
```bash
npm run build
# No errors
```

## Data Requirements

Each approval item needs:
- id
- description
- propertyCode, unitNumber
- technicianId, technicianName
- completedAt (when tech marked ready)
- deadline
- photos.before: string[] (URLs)
- photos.after: string[]
- photos.cleanup: string[]
- techNotes

API endpoints needed:
- GET /api/approval-queue
- POST /api/work-orders/:id/approve
- POST /api/work-orders/:id/reject { reason: string, notes?: string }

## Performance Considerations

- Lazy load photo thumbnails (use loading="lazy")
- Preload next item's photos when current is focused
- Virtualize list if > 50 items
- Compress thumbnails server-side (150x150)

## Mobile Considerations

- Stack photo thumbnails vertically
- Larger touch targets for Approve/Reject
- Swipe gestures: Right = Approve, Left = Reject (optional)
- Full-screen lightbox on mobile

## Notes

- Photos are the critical decision point - make them prominent
- Most approvals should be "glance and click" - don't add friction
- Rejection needs a reason for audit trail and tech feedback
- Auto-advance after approve keeps the flow going
- Keyboard shortcuts are for power users who process high volume
- Consider adding "Approve All" for batches of obviously-good items (risky but fast)
