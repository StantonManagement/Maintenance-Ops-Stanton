import { useState, useCallback } from 'react';
import { supabase } from '../services/supabase';

export interface TenantSession {
  id: string;
  phone: string;
  verified: boolean;
  verifiedAt?: string;
  unitId?: string;
  propertyId?: string;
}

export interface TenantRequest {
  id: string;
  phone: string;
  category: string;
  description: string;
  permissionToEnter: 'yes' | 'no' | 'call_first';
  urgency: 'emergency' | 'urgent' | 'normal';
  preferredTime?: string;
  photos: string[];
  workOrderId?: string;
  status: 'submitted' | 'work_order_created' | 'in_progress' | 'scheduled' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface TenantMessage {
  id: string;
  requestId: string;
  senderType: 'tenant' | 'coordinator' | 'system';
  message: string;
  createdAt: string;
}

const DEV_VERIFICATION_CODE = '123456';

export function useTenantPortal() {
  const [session, setSession] = useState<TenantSession | null>(() => {
    // Restore session from localStorage
    const stored = localStorage.getItem('tenant_portal_session');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return null;
      }
    }
    return null;
  });
  const [requests, setRequests] = useState<TenantRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Start verification - creates session and returns code
  const startVerification = useCallback(async (phone: string): Promise<{ sessionId: string; code: string }> => {
    setLoading(true);
    setError(null);
    
    try {
      // In dev, always use 123456. In production, generate random code and send SMS
      const code = DEV_VERIFICATION_CODE;
      
      const { data, error: insertError } = await supabase
        .from('tenant_portal_sessions')
        .insert({
          phone,
          verification_code: code
        })
        .select()
        .single();

      if (insertError) {
        console.warn('Failed to create session in DB:', insertError.message);
        // Fallback to local session
        const localSession: TenantSession = {
          id: `session-${Date.now()}`,
          phone,
          verified: false
        };
        return { sessionId: localSession.id, code };
      }

      return { sessionId: data.id, code };
    } catch (err) {
      console.error('Error starting verification:', err);
      setError('Failed to start verification');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Verify code
  const verifyCode = useCallback(async (sessionId: string, code: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      // In dev, accept 123456
      if (code !== DEV_VERIFICATION_CODE) {
        setError('Invalid verification code');
        return false;
      }

      const { data, error: updateError } = await supabase
        .from('tenant_portal_sessions')
        .update({ verified_at: new Date().toISOString() })
        .eq('id', sessionId)
        .select()
        .single();

      if (updateError) {
        console.warn('Failed to verify session in DB:', updateError.message);
      }

      const verifiedSession: TenantSession = {
        id: sessionId,
        phone: data?.phone || '',
        verified: true,
        verifiedAt: new Date().toISOString(),
        unitId: data?.unit_id,
        propertyId: data?.property_id
      };

      setSession(verifiedSession);
      localStorage.setItem('tenant_portal_session', JSON.stringify(verifiedSession));
      
      return true;
    } catch (err) {
      console.error('Error verifying code:', err);
      setError('Verification failed');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Submit a maintenance request
  const submitRequest = useCallback(async (data: {
    category: string;
    description: string;
    permissionToEnter: 'yes' | 'no' | 'call_first';
    urgency: 'emergency' | 'urgent' | 'normal';
    preferredTime?: string;
    photos?: string[];
  }): Promise<{ requestId: string; workOrderId: string } | null> => {
    if (!session?.verified) {
      setError('Session not verified');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      // Generate work order ID
      const workOrderId = `WO-TENANT-${Date.now()}`;

      // Create the portal request
      const { data: request, error: requestError } = await supabase
        .from('tenant_portal_requests')
        .insert({
          session_id: session.id,
          phone: session.phone,
          category: data.category,
          description: data.description,
          permission_to_enter: data.permissionToEnter,
          urgency: data.urgency,
          preferred_time: data.preferredTime,
          photos: data.photos || [],
          work_order_id: workOrderId,
          status: 'work_order_created'
        })
        .select()
        .single();

      if (requestError) {
        console.error('Failed to create request:', requestError.message);
        setError('Failed to submit request');
        return null;
      }

      // Create work order action to track this
      const { error: actionError } = await supabase
        .from('work_order_actions')
        .insert({
          work_order_id: workOrderId,
          action_type: 'note',
          action_data: {
            type: 'tenant_portal_submission',
            request_id: request.id,
            category: data.category,
            description: data.description,
            urgency: data.urgency,
            permission_to_enter: data.permissionToEnter,
            preferred_time: data.preferredTime,
            tenant_phone: session.phone,
            source: 'tenant_portal'
          },
          created_by: 'tenant_portal'
        });

      if (actionError) {
        console.warn('Failed to create work order action:', actionError.message);
      }

      // Add to local state
      const newRequest: TenantRequest = {
        id: request.id,
        phone: session.phone,
        category: data.category,
        description: data.description,
        permissionToEnter: data.permissionToEnter,
        urgency: data.urgency,
        preferredTime: data.preferredTime,
        photos: data.photos || [],
        workOrderId,
        status: 'work_order_created',
        createdAt: request.created_at
      };
      setRequests(prev => [newRequest, ...prev]);

      return { requestId: request.id, workOrderId };
    } catch (err) {
      console.error('Error submitting request:', err);
      setError('Failed to submit request');
      return null;
    } finally {
      setLoading(false);
    }
  }, [session]);

  // Get requests for current session
  const fetchMyRequests = useCallback(async () => {
    if (!session?.phone) return;

    setLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('tenant_portal_requests')
        .select('*')
        .eq('phone', session.phone)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.warn('Failed to fetch requests:', fetchError.message);
        return;
      }

      if (data) {
        setRequests(data.map(r => ({
          id: r.id,
          phone: r.phone,
          category: r.category,
          description: r.description,
          permissionToEnter: r.permission_to_enter,
          urgency: r.urgency,
          preferredTime: r.preferred_time,
          photos: r.photos || [],
          workOrderId: r.work_order_id,
          status: r.status,
          createdAt: r.created_at
        })));
      }
    } catch (err) {
      console.error('Error fetching requests:', err);
    } finally {
      setLoading(false);
    }
  }, [session?.phone]);

  // Send a message on a request
  const sendMessage = useCallback(async (requestId: string, message: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('tenant_messages')
        .insert({
          request_id: requestId,
          sender_type: 'tenant',
          message
        });

      if (error) {
        console.error('Failed to send message:', error.message);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Error sending message:', err);
      return false;
    }
  }, []);

  // Get messages for a request
  const getMessages = useCallback(async (requestId: string): Promise<TenantMessage[]> => {
    try {
      const { data, error } = await supabase
        .from('tenant_messages')
        .select('*')
        .eq('request_id', requestId)
        .order('created_at', { ascending: true });

      if (error) {
        console.warn('Failed to fetch messages:', error.message);
        return [];
      }

      return (data || []).map(m => ({
        id: m.id,
        requestId: m.request_id,
        senderType: m.sender_type,
        message: m.message,
        createdAt: m.created_at
      }));
    } catch (err) {
      console.error('Error fetching messages:', err);
      return [];
    }
  }, []);

  // Logout / clear session
  const logout = useCallback(() => {
    setSession(null);
    setRequests([]);
    localStorage.removeItem('tenant_portal_session');
  }, []);

  return {
    session,
    requests,
    loading,
    error,
    startVerification,
    verifyCode,
    submitRequest,
    fetchMyRequests,
    sendMessage,
    getMessages,
    logout,
    isVerified: session?.verified || false
  };
}
