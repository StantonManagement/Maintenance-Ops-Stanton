# PRP-P1-06: Bulk Message

## Goal
Enable sending messages to multiple tenants at once - by selection, building, portfolio, or all tenants.

## Success Criteria
- [ ] Bulk Message button opens recipient picker modal
- [ ] Four recipient modes: Selected, Building, Portfolio, All
- [ ] "Selected" uses work orders selected in list (requires selection)
- [ ] "Building" shows building picker, selects all tenants in building
- [ ] "Portfolio" shows portfolio picker (if multi-portfolio)
- [ ] Preview shows recipient count before sending
- [ ] Compose message with template option
- [ ] Send creates message records for each recipient
- [ ] Progress indicator during bulk send
- [ ] Success summary with count

---

## Context

**Files involved:**
- `src/components/WorkOrderList.tsx` - Bulk Message button
- New: `src/components/BulkMessageModal.tsx`
- `src/hooks/useMessages.ts` - sendMessage function
- Supabase: `messages`, `work_orders`, `properties` tables

**Current state:**
- "Bulk Message" button exists but only logs to console
- Message sending works for single conversations
- No recipient picker UI

**Use cases:**
1. "Tell all tenants in Building A about water shutoff tomorrow"
2. "Message these 5 selected work order tenants about scheduling"
3. "Notify entire portfolio about holiday office hours"

---

## Tasks

### Task 1: Create Recipient Types

ADD to `src/types/index.ts`:

```typescript
export type BulkMessageRecipientMode = 
  | 'selected'    // Work orders currently selected in list
  | 'building'    // All tenants in a specific building
  | 'portfolio'   // All tenants in a portfolio
  | 'all';        // All tenants

export interface BulkMessageRecipient {
  work_order_id: string;
  tenant_name: string;
  property_address: string;
  unit: string;
}
```

### Task 2: Create Bulk Message Modal

CREATE `src/components/BulkMessageModal.tsx`:

```typescript
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Users, Building, Briefcase, Globe, Send, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import type { WorkOrder, BulkMessageRecipient } from '@/types';

interface BulkMessageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedWorkOrders?: WorkOrder[]; // Pre-selected from list
}

// Message templates
const MESSAGE_TEMPLATES = [
  { id: 'custom', label: 'Custom Message', content: '' },
  { 
    id: 'scheduling', 
    label: 'Scheduling Update',
    content: 'Hi, we wanted to update you on your maintenance request. Our team will be in touch shortly to schedule a time that works for you.'
  },
  { 
    id: 'water_shutoff', 
    label: 'Water Shutoff Notice',
    content: 'Notice: Water service will be temporarily shut off on [DATE] from [TIME] to [TIME] for scheduled maintenance. Please plan accordingly.'
  },
  { 
    id: 'completed', 
    label: 'Work Completed',
    content: 'Good news! The maintenance work at your unit has been completed. Please let us know if you have any questions or concerns.'
  },
  {
    id: 'holiday_hours',
    label: 'Holiday Hours',
    content: 'Our maintenance office will have modified hours during the upcoming holiday. Emergency services remain available 24/7.'
  },
];

export function BulkMessageModal({
  open,
  onOpenChange,
  selectedWorkOrders = [],
}: BulkMessageModalProps) {
  const [mode, setMode] = useState<'selected' | 'building' | 'portfolio' | 'all'>(
    selectedWorkOrders.length > 0 ? 'selected' : 'building'
  );
  const [selectedBuilding, setSelectedBuilding] = useState<string>('');
  const [selectedPortfolio, setSelectedPortfolio] = useState<string>('');
  const [buildings, setBuildings] = useState<{ id: string; name: string }[]>([]);
  const [portfolios, setPortfolios] = useState<{ id: string; name: string }[]>([]);
  const [recipients, setRecipients] = useState<BulkMessageRecipient[]>([]);
  const [template, setTemplate] = useState('custom');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState(0);
  const [completed, setCompleted] = useState(false);

  // Fetch buildings and portfolios on mount
  useEffect(() => {
    async function fetchOptions() {
      // Get unique buildings from work orders
      const { data: workOrders } = await supabase
        .from('work_orders')
        .select('property_code, property_address')
        .not('property_code', 'is', null);
      
      const uniqueBuildings = new Map<string, string>();
      workOrders?.forEach(wo => {
        if (wo.property_code && !uniqueBuildings.has(wo.property_code)) {
          uniqueBuildings.set(wo.property_code, wo.property_address);
        }
      });
      
      setBuildings(
        Array.from(uniqueBuildings.entries()).map(([id, name]) => ({ id, name }))
      );

      // If you have a portfolios table, fetch it here
      // For now, using placeholder
      setPortfolios([
        { id: 'main', name: 'Main Portfolio' },
      ]);
    }
    
    if (open) {
      fetchOptions();
    }
  }, [open]);

  // Update recipients when mode/selection changes
  useEffect(() => {
    async function updateRecipients() {
      let newRecipients: BulkMessageRecipient[] = [];

      switch (mode) {
        case 'selected':
          newRecipients = selectedWorkOrders.map(wo => ({
            work_order_id: wo.id,
            tenant_name: wo.resident_name,
            property_address: wo.property_address,
            unit: wo.unit,
          }));
          break;

        case 'building':
          if (selectedBuilding) {
            const { data } = await supabase
              .from('work_orders')
              .select('id, resident_name, property_address, unit')
              .eq('property_code', selectedBuilding);
            
            // Dedupe by resident (one message per tenant, not per work order)
            const seen = new Set<string>();
            newRecipients = (data || [])
              .filter(wo => {
                const key = `${wo.resident_name}-${wo.unit}`;
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
              })
              .map(wo => ({
                work_order_id: wo.id,
                tenant_name: wo.resident_name,
                property_address: wo.property_address,
                unit: wo.unit,
              }));
          }
          break;

        case 'all':
          const { data: allWOs } = await supabase
            .from('work_orders')
            .select('id, resident_name, property_address, unit');
          
          // Dedupe by resident
          const allSeen = new Set<string>();
          newRecipients = (allWOs || [])
            .filter(wo => {
              const key = `${wo.resident_name}-${wo.unit}`;
              if (allSeen.has(key)) return false;
              allSeen.add(key);
              return true;
            })
            .map(wo => ({
              work_order_id: wo.id,
              tenant_name: wo.resident_name,
              property_address: wo.property_address,
              unit: wo.unit,
            }));
          break;
      }

      setRecipients(newRecipients);
    }

    updateRecipients();
  }, [mode, selectedBuilding, selectedPortfolio, selectedWorkOrders]);

  // Update message when template changes
  useEffect(() => {
    const tpl = MESSAGE_TEMPLATES.find(t => t.id === template);
    if (tpl && tpl.content) {
      setMessage(tpl.content);
    }
  }, [template]);

  const handleSend = async () => {
    if (!message.trim() || recipients.length === 0) return;

    setSending(true);
    setProgress(0);
    setCompleted(false);

    try {
      // Create messages in batches
      const batchSize = 10;
      let sent = 0;

      for (let i = 0; i < recipients.length; i += batchSize) {
        const batch = recipients.slice(i, i + batchSize);
        
        const messages = batch.map(recipient => ({
          work_order_id: recipient.work_order_id,
          sender_type: 'coordinator',
          content: message.trim(),
          is_read: true, // Coordinator's messages are "read"
        }));

        const { error } = await supabase
          .from('messages')
          .insert(messages);

        if (error) throw error;

        sent += batch.length;
        setProgress(Math.round((sent / recipients.length) * 100));
      }

      setCompleted(true);
      toast.success(`Sent message to ${recipients.length} recipients`);
      
      // Close after short delay to show completion
      setTimeout(() => {
        onOpenChange(false);
        setCompleted(false);
        setMessage('');
        setTemplate('custom');
      }, 1500);

    } catch (error) {
      console.error('Bulk message error:', error);
      toast.error('Failed to send some messages');
    } finally {
      setSending(false);
    }
  };

  const getModeIcon = (m: string) => {
    switch (m) {
      case 'selected': return <Users className="h-4 w-4" />;
      case 'building': return <Building className="h-4 w-4" />;
      case 'portfolio': return <Briefcase className="h-4 w-4" />;
      case 'all': return <Globe className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Send Bulk Message</DialogTitle>
        </DialogHeader>

        {completed ? (
          <div className="py-8 text-center">
            <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
            <p className="text-lg font-medium">Messages Sent!</p>
            <p className="text-muted-foreground">
              Delivered to {recipients.length} recipients
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4 py-4">
              {/* Recipient Mode */}
              <div>
                <Label className="mb-2 block">Send To</Label>
                <RadioGroup
                  value={mode}
                  onValueChange={(v) => setMode(v as typeof mode)}
                  className="grid grid-cols-2 gap-2"
                >
                  <div className="flex items-center space-x-2 p-3 border rounded-lg">
                    <RadioGroupItem 
                      value="selected" 
                      id="selected"
                      disabled={selectedWorkOrders.length === 0}
                    />
                    <Label htmlFor="selected" className="flex items-center gap-2 cursor-pointer">
                      <Users className="h-4 w-4" />
                      Selected ({selectedWorkOrders.length})
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2 p-3 border rounded-lg">
                    <RadioGroupItem value="building" id="building" />
                    <Label htmlFor="building" className="flex items-center gap-2 cursor-pointer">
                      <Building className="h-4 w-4" />
                      Building
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2 p-3 border rounded-lg">
                    <RadioGroupItem value="portfolio" id="portfolio" />
                    <Label htmlFor="portfolio" className="flex items-center gap-2 cursor-pointer">
                      <Briefcase className="h-4 w-4" />
                      Portfolio
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2 p-3 border rounded-lg">
                    <RadioGroupItem value="all" id="all" />
                    <Label htmlFor="all" className="flex items-center gap-2 cursor-pointer">
                      <Globe className="h-4 w-4" />
                      All Tenants
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Building Picker */}
              {mode === 'building' && (
                <div>
                  <Label>Select Building</Label>
                  <Select value={selectedBuilding} onValueChange={setSelectedBuilding}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a building..." />
                    </SelectTrigger>
                    <SelectContent>
                      {buildings.map(b => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Portfolio Picker */}
              {mode === 'portfolio' && (
                <div>
                  <Label>Select Portfolio</Label>
                  <Select value={selectedPortfolio} onValueChange={setSelectedPortfolio}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a portfolio..." />
                    </SelectTrigger>
                    <SelectContent>
                      {portfolios.map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Recipient Preview */}
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Recipients</span>
                  <Badge variant="secondary">{recipients.length}</Badge>
                </div>
                {recipients.length > 0 && recipients.length <= 5 && (
                  <div className="mt-2 text-sm text-muted-foreground">
                    {recipients.map(r => r.tenant_name).join(', ')}
                  </div>
                )}
                {recipients.length > 5 && (
                  <div className="mt-2 text-sm text-muted-foreground">
                    {recipients.slice(0, 3).map(r => r.tenant_name).join(', ')} 
                    {' '}and {recipients.length - 3} more
                  </div>
                )}
              </div>

              {/* Template Picker */}
              <div>
                <Label>Template</Label>
                <Select value={template} onValueChange={setTemplate}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MESSAGE_TEMPLATES.map(t => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Message Content */}
              <div>
                <Label>Message</Label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message..."
                  rows={4}
                />
              </div>

              {/* Progress during send */}
              {sending && (
                <div>
                  <Progress value={progress} className="h-2" />
                  <p className="text-sm text-muted-foreground mt-1">
                    Sending... {progress}%
                  </p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>
                Cancel
              </Button>
              <Button
                onClick={handleSend}
                disabled={!message.trim() || recipients.length === 0 || sending}
              >
                <Send className="h-4 w-4 mr-2" />
                Send to {recipients.length} Recipients
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
```

### Task 3: Wire Up Bulk Message Button

MODIFY `src/components/WorkOrderList.tsx`:

```typescript
import { BulkMessageModal } from './BulkMessageModal';

// In component:
const [bulkMessageOpen, setBulkMessageOpen] = useState(false);

// In bulk action bar:
<Button
  variant="outline"
  onClick={() => setBulkMessageOpen(true)}
>
  <MessageSquare className="h-4 w-4 mr-2" />
  Bulk Message
</Button>

// Add modal:
<BulkMessageModal
  open={bulkMessageOpen}
  onOpenChange={setBulkMessageOpen}
  selectedWorkOrders={selectedWorkOrders}
/>
```

### Task 4: Add Standalone Bulk Message Access

Bulk message should also be accessible without pre-selecting work orders:

MODIFY header or add to page:

```tsx
// Add button to MessagesPage header or main nav
<Button onClick={() => setBulkMessageOpen(true)}>
  <Users className="h-4 w-4 mr-2" />
  Bulk Message
</Button>
```

---

## Validation

```bash
# Type check
npx tsc --noEmit

# Build
npm run build

# Manual testing:
# 1. Select 3 work orders, click "Bulk Message"
# 2. Mode defaults to "Selected" with count showing
# 3. Switch to "Building", pick a building, see recipient count update
# 4. Choose template, see message populate
# 5. Edit message if needed
# 6. Click Send - progress shows
# 7. Completion screen shows
# 8. Check messages table - records created
```

---

## Future Enhancements (Not in this PRP)

- SMS delivery via Twilio (Phase 2)
- Scheduled send (send later)
- Personalization tokens (Hi {tenant_name})
- Delivery tracking/receipts
- Message history per bulk send campaign
