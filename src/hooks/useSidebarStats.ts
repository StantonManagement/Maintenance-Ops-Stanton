import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/services/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface SidebarStats {
  unreadMessages: number;
  messagesWaitingReply: number;
  totalConversations: number;
  approvalQueue: number;
  newToday: number;
  emergencyCount: number;
  inProgress: number;
}

const defaultStats: SidebarStats = {
  unreadMessages: 0,
  messagesWaitingReply: 0,
  totalConversations: 0,
  approvalQueue: 0,
  newToday: 0,
  emergencyCount: 0,
  inProgress: 0,
};

export function useSidebarStats() {
  const [stats, setStats] = useState<SidebarStats>(defaultStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const { data, error: rpcError } = await supabase.rpc('get_sidebar_stats');
      
      if (rpcError) throw rpcError;
      
      if (data) {
        // Handle both possible casing responses depending on how RPC returns it (Postgres often returns lower case keys)
        // casting data to any to access properties safely
        const statsData = data as any;
        setStats({
          unreadMessages: statsData.unread_messages || 0,
          messagesWaitingReply: statsData.messages_waiting_reply || 0,
          totalConversations: statsData.total_conversations || 0,
          approvalQueue: statsData.approval_queue || 0,
          newToday: statsData.new_today || 0,
          emergencyCount: statsData.emergency_count || 0,
          inProgress: statsData.in_progress || 0,
        });
      }
      setError(null);
    } catch (err) {
      console.error('Error fetching sidebar stats:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch stats'));
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced refetch to avoid hammering the DB
  const debouncedRefetch = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      fetchStats();
    }, 500); // Wait 500ms after last change
  }, [fetchStats]);

  const refetch = useCallback(() => {
    setLoading(true);
    fetchStats();
  }, [fetchStats]);

  // Initial fetch
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Real-time subscriptions
  useEffect(() => {
    const channel = supabase
      .channel('sidebar-stats')
      // Listen for message changes
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'messages',
        },
        () => {
          console.log('Messages changed, refreshing stats');
          debouncedRefetch();
        }
      )
      // Listen for work order changes
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'AF_work_order_new',
        },
        () => {
          console.log('Work orders changed, refreshing stats');
          debouncedRefetch();
        }
      )
      .subscribe((status) => {
        console.log(`Sidebar stats subscription: ${status}`);
      });

    channelRef.current = channel;

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [debouncedRefetch]);

  // Fallback polling (every 60 seconds)
  useEffect(() => {
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  return { stats, loading, error, refetch };
}
