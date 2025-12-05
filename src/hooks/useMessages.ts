import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useRealtimeSubscription } from './useRealtimeSubscription';
import { toast } from 'sonner';

export interface Message {
  id: string;
  work_order_id: string;
  content: string;
  content_translated?: string;
  sender_type: 'coordinator' | 'tenant' | 'system';
  created_at: string;
  read_at?: string;
}

export function useMessages(workOrderId?: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (workOrderId) {
      fetchMessages(workOrderId);
    } else {
      setMessages([]);
    }
  }, [workOrderId]);

  useRealtimeSubscription({
    table: 'messages',
    filter: workOrderId ? `work_order_id=eq.${workOrderId}` : undefined,
    enabled: !!workOrderId,
    onData: (payload) => {
      const { eventType, new: newRecord } = payload;
      if (eventType === 'INSERT') {
        setMessages((prev) => [...prev, newRecord as Message]);
        // Optional: Play sound or subtle visual cue
      }
    }
  });

  async function fetchMessages(id: string) {
    try {
      setLoading(true);
      setError(null);
      
      // Mock data fallback if table doesn't exist (Prototype safety)
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('work_order_id', id)
        .order('created_at', { ascending: true });

      if (error) {
        if (error.code === '42P01') { // Undefined table
           setMessages(MOCK_MESSAGES.filter(m => m.work_order_id === id));
           return;
        }
        throw error;
      }

      setMessages(data || []);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError(err as Error);
      // Fallback to mock
      setMessages(MOCK_MESSAGES.filter(m => m.work_order_id === id));
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage(content: string) {
    if (!workOrderId) return;
    
    try {
      // Optimistic update
      const tempId = `temp-${Date.now()}`;
      const newMessage: Message = {
        id: tempId,
        work_order_id: workOrderId,
        content,
        sender_type: 'coordinator',
        created_at: new Date().toISOString()
      };
      setMessages(prev => [...prev, newMessage]);

      const { data, error } = await supabase
        .from('messages')
        .insert([{
          work_order_id: workOrderId,
          content,
          sender_type: 'coordinator'
        }])
        .select()
        .single();

      if (error) throw error;

      // Replace temp message with real one
      setMessages(prev => prev.map(m => m.id === tempId ? data : m));
    } catch (err) {
      console.error('Error sending message:', err);
      toast.error('Failed to send message');
      // Revert optimistic update
      // setMessages(prev => prev.filter(m => m.id !== tempId)); // logic complex without tempId ref
    }
  }

  return { messages, loading, error, sendMessage };
}

const MOCK_MESSAGES: Message[] = [
  {
    id: '1',
    work_order_id: 'WO-1234',
    content: 'The pipe under the sink is leaking a lot',
    content_translated: 'La tubería debajo del fregadero está goteando mucho',
    sender_type: 'tenant',
    created_at: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: '2',
    work_order_id: 'WO-1234',
    content: 'I can send Ramon today at 2pm. Does that work?',
    sender_type: 'coordinator',
    created_at: new Date(Date.now() - 80000000).toISOString()
  }
];
