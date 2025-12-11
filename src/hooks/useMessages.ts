import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, MessageDB } from '../services/supabase';
import { Message, SendMessageInput, MessageThread, MessageSenderType } from '../types';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { useActivePortfolio } from '../providers/PortfolioProvider';

// Transform DB row to frontend type
function transformMessage(row: MessageDB): Message {
  return {
    id: row.id,
    workOrderId: row.work_order_id,
    senderType: row.sender_type as MessageSenderType,
    senderId: row.sender_id || undefined,
    senderName: row.sender_name || undefined,
    content: row.content || '',
    translatedContent: row.content_translated || undefined,
    originalLanguage: row.original_language || 'en',
    isRead: row.read_at !== null,
    readAt: row.read_at || undefined,
    createdAt: row.created_at,
    updatedAt: row.created_at, // Schema doesn't have updated_at, using created_at
  };
}

interface UseMessagesOptions {
  workOrderId?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
  enableRealtime?: boolean;
}

interface UseMessagesReturn {
  messages: Message[];
  loading: boolean;
  error: Error | null;
  sendMessage: (input: SendMessageInput) => Promise<Message | null>;
  markAsRead: (messageId: string) => Promise<void>;
  markAllAsRead: (workOrderId: string) => Promise<void>;
  refetch: () => void;
}

export function useMessages(options: UseMessagesOptions = {}): UseMessagesReturn {
  const { workOrderId, autoRefresh = false, refreshInterval = 10000, enableRealtime = true } = options;
  const { activePortfolio } = useActivePortfolio();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const fetchMessages = useCallback(async () => {
    if (!activePortfolio?.id) return;

    try {
      let query = supabase
        .from('messages')
        .select('*')
        .eq('portfolio_id', activePortfolio.id)
        .order('created_at', { ascending: true });
      
      if (workOrderId) {
        query = query.eq('work_order_id', workOrderId);
      }
      
      const { data, error: fetchError } = await query;
      
      if (fetchError) throw fetchError;
      
      setMessages((data || []).map(transformMessage));
      setError(null);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch messages'));
    } finally {
      setLoading(false);
    }
  }, [workOrderId, activePortfolio?.id]);

  const sendMessage = useCallback(async (input: SendMessageInput): Promise<Message | null> => {
    if (!activePortfolio?.id) {
      console.error('No active portfolio');
      return null;
    }

    // Optimistic update
    const optimisticId = `temp-${Date.now()}`;
    const optimisticMessage: Message = {
      id: optimisticId,
      workOrderId: input.workOrderId,
      senderType: input.senderType,
      senderId: input.senderId,
      senderName: input.senderName,
      content: input.content,
      translatedContent: undefined,
      originalLanguage: input.originalLanguage || 'en',
      isRead: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setMessages(prev => [...prev, optimisticMessage]);

    try {
      const { data, error: insertError } = await supabase
        .from('messages')
        .insert({
          portfolio_id: activePortfolio.id,
          work_order_id: input.workOrderId,
          sender_type: input.senderType,
          sender_id: input.senderId,
          sender_name: input.senderName,
          content: input.content,
          original_language: input.originalLanguage || 'en',
          read_at: null // Explicitly unread
        })
        .select()
        .single();
      
      if (insertError) throw insertError;
      
      const newMessage = transformMessage(data);
      
      // Replace optimistic message with real one
      setMessages(prev => prev.map(m => m.id === optimisticId ? newMessage : m));
      
      return newMessage;
    } catch (err) {
      console.error('Error sending message:', err);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== optimisticId));
      throw err;
    }
  }, [activePortfolio?.id]);

  const markAsRead = useCallback(async (messageId: string): Promise<void> => {
    try {
      const { error: updateError } = await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('id', messageId);
      
      if (updateError) throw updateError;
      
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, isRead: true, readAt: new Date().toISOString() }
            : msg
        )
      );
    } catch (err) {
      console.error('Error marking message as read:', err);
      throw err;
    }
  }, []);

  const markAllAsRead = useCallback(async (woId: string): Promise<void> => {
    if (!activePortfolio?.id) return;
    
    try {
      const { error: updateError } = await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('work_order_id', woId)
        .is('read_at', null); // Only mark unread ones
      
      if (updateError) throw updateError;
      
      setMessages(prev => 
        prev.map(msg => 
          msg.workOrderId === woId
            ? { ...msg, isRead: true, readAt: new Date().toISOString() }
            : msg
        )
      );
    } catch (err) {
      console.error('Error marking all messages as read:', err);
      throw err;
    }
  }, [activePortfolio?.id]);

  const refetch = useCallback(() => {
    setLoading(true);
    fetchMessages();
  }, [fetchMessages]);

  // Initial fetch
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Real-time subscription
  useEffect(() => {
    if (!enableRealtime) return;

    // Create unique channel name
    const channelName = workOrderId 
      ? `messages:wo:${workOrderId}` 
      : 'messages:all';

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          ...(workOrderId && { filter: `work_order_id=eq.${workOrderId}` }),
        },
        (payload) => {
          console.log('New message received:', payload);
          const newMessage = transformMessage(payload.new as MessageDB);
          setMessages(prev => {
            // Avoid duplicates (in case we just sent it and optimistic update is pending)
            // Note: Optimistic updates have temp IDs, so we might get a duplicate if the real ID comes in before we swap
            // But here we check against existing IDs. Realtime usually comes after write confirmation.
            if (prev.some(m => m.id === newMessage.id)) {
              return prev;
            }
            return [...prev, newMessage];
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          ...(workOrderId && { filter: `work_order_id=eq.${workOrderId}` }),
        },
        (payload) => {
          console.log('Message updated:', payload);
          const updatedMessage = transformMessage(payload.new as MessageDB);
          setMessages(prev =>
            prev.map(m => m.id === updatedMessage.id ? updatedMessage : m)
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          console.log('Message deleted:', payload);
          setMessages(prev =>
            prev.filter(m => m.id !== payload.old.id)
          );
        }
      )
      .subscribe((status) => {
        console.log(`Real-time subscription status: ${status}`);
      });

    channelRef.current = channel;

    // Cleanup on unmount
    return () => {
      console.log('Cleaning up real-time subscription');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [workOrderId, enableRealtime]);

  // Auto-refresh (fallback or supplement)
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(fetchMessages, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchMessages]);

  return {
    messages,
    loading,
    error,
    sendMessage,
    markAsRead,
    markAllAsRead,
    refetch,
  };
}

// ============================================
// Convenience hook for a single work order thread
// ============================================

export function useMessageThread(workOrderId: string): MessageThread & {
  loading: boolean;
  error: Error | null;
  sendMessage: (content: string, senderType: MessageSenderType, senderName?: string) => Promise<Message | null>;
  markAllAsRead: () => Promise<void>;
  refetch: () => void;
} {
  const { messages, loading, error, sendMessage, markAllAsRead, refetch } = useMessages({
    workOrderId,
    enableRealtime: true, // Enable realtime for threads
    autoRefresh: false, // Rely on realtime primarily
  });

  const unreadCount = messages.filter(m => !m.isRead).length;
  const lastMessage = messages.length > 0 ? messages[messages.length - 1] : undefined;

  const sendThreadMessage = useCallback(
    async (content: string, senderType: MessageSenderType, senderName?: string) => {
      return sendMessage({
        workOrderId,
        senderType,
        senderName,
        content,
      });
    },
    [workOrderId, sendMessage]
  );

  const markThreadAsRead = useCallback(() => markAllAsRead(workOrderId), [workOrderId, markAllAsRead]);

  return {
    workOrderId,
    messages,
    unreadCount,
    lastMessage,
    loading,
    error,
    sendMessage: sendThreadMessage,
    markAllAsRead: markThreadAsRead,
    refetch,
  };
}
