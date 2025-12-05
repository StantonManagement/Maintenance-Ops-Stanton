import { useState } from 'react';
import { supabase } from '../services/supabase';
import { useRealtimeSubscription } from './useRealtimeSubscription';
import { toast } from 'sonner';

interface AutoSendState {
  isProcessing: boolean;
  pendingMessage: {
    workOrderId: string;
    trigger: string;
    recipient: string;
    content: string;
  } | null;
}

export function useAutoSend() {
  const [state, setState] = useState<AutoSendState>({
    isProcessing: false,
    pendingMessage: null
  });

  // Listen for changes that might trigger auto-send
  // In a real app, this might be better handled by a backend function/trigger
  // But for this prototype, we simulate it on the client side for the coordinator's view
  useRealtimeSubscription({
    table: 'work_orders', // Using AF table name from config
    onData: async (payload) => {
      const { eventType, new: newRecord, old: oldRecord } = payload;
      
      if (eventType === 'UPDATE') {
        // Check for status changes
        if (oldRecord.Status !== 'ASSIGNED' && newRecord.Status === 'ASSIGNED') {
          // Trigger Assignment Notification
          handleTrigger('assignment', newRecord);
        }
        
        if (oldRecord.Status !== 'COMPLETED' && newRecord.Status === 'COMPLETED') {
          // Trigger Completion Notification
          handleTrigger('completion', newRecord);
        }
      }
    }
  });

  const handleTrigger = async (trigger: string, workOrder: any) => {
    // 1. Check if auto-send is enabled for this trigger (mock check)
    const isEnabled = true; 
    if (!isEnabled) return;

    // 2. Generate message from template (mock)
    const template = getTemplate(trigger);
    const content = fillTemplate(template, workOrder);

    // 3. Set pending state (which could trigger a UI modal if we want interception)
    // For fully automated, we just send.
    // For "Pre-Send Preview", we'd set this state and let the UI react.
    setState({
      isProcessing: true,
      pendingMessage: {
        workOrderId: workOrder.id,
        trigger,
        recipient: workOrder.PrimaryTenant || 'Resident',
        content
      }
    });

    // Simulate network delay / pre-send window
    // In PRP-10 Task 5, we want a "Pre-Send Preview Modal". 
    // So we stop here and let the UI pick up `pendingMessage`.
  };

  const confirmSend = async () => {
    if (!state.pendingMessage) return;

    try {
      // Create message record
      await supabase.from('messages').insert({
        work_order_id: state.pendingMessage.workOrderId,
        content: state.pendingMessage.content,
        sender_type: 'system',
        created_at: new Date().toISOString()
      });

      toast.success('Auto-notification sent');
      setState({ isProcessing: false, pendingMessage: null });
    } catch (err) {
      console.error('Failed to send auto-message:', err);
      toast.error('Failed to send notification');
    }
  };

  const cancelSend = () => {
    setState({ isProcessing: false, pendingMessage: null });
    toast.info('Auto-notification cancelled');
  };

  return {
    pendingMessage: state.pendingMessage,
    confirmSend,
    cancelSend
  };
}

// Mock Helpers
function getTemplate(trigger: string) {
  const templates: Record<string, string> = {
    assignment: "Hi {{tenant_name}}, a technician has been assigned to your request '{{work_order_title}}'.",
    completion: "Good news! The work for '{{work_order_title}}' has been marked as complete."
  };
  return templates[trigger] || "Update on your maintenance request.";
}

function fillTemplate(template: string, wo: any) {
  return template
    .replace('{{tenant_name}}', wo.PrimaryTenant || 'Resident')
    .replace('{{work_order_title}}', wo.JobDescription?.substring(0, 20) + '...' || 'Maintenance Request');
}
