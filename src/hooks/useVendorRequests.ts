import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';

export interface VendorRequest {
  id: string;
  work_order_id: string;
  work_order_title: string;
  property: string;
  unit: string;
  category: string;
  priority: 'emergency' | 'high' | 'normal' | 'low';
  vendor_ids: string[];
  status: 'pending' | 'responses_received' | 'vendor_selected' | 'completed' | 'cancelled';
  deadline: string;
  created_at: string;
  selected_vendor_id?: string;
  description: string;
}

export interface VendorResponse {
  id: string;
  request_id: string;
  vendor_id: string;
  vendor_name: string;
  vendor_company: string;
  response: 'accepted' | 'declined' | 'info_needed' | 'pending';
  proposed_time?: string;
  quote_amount?: number;
  notes?: string;
  responded_at?: string;
}

// Mock data
const mockRequests: VendorRequest[] = [
  {
    id: 'req-001',
    work_order_id: 'WO-1234',
    work_order_title: 'Emergency water heater replacement',
    property: 'Building A',
    unit: 'Unit 205',
    category: 'Plumbing',
    priority: 'emergency',
    vendor_ids: ['vendor-001', 'vendor-003'],
    status: 'responses_received',
    deadline: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    description: 'Water heater is leaking and needs immediate replacement. 40 gallon gas unit.'
  },
  {
    id: 'req-002',
    work_order_id: 'WO-1235',
    work_order_title: 'HVAC system not cooling',
    property: '90 Park St',
    unit: 'Unit 310',
    category: 'HVAC',
    priority: 'high',
    vendor_ids: ['vendor-003'],
    status: 'pending',
    deadline: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    description: 'Central AC unit not producing cold air. Tenant reports it was working yesterday.'
  }
];

const mockResponses: VendorResponse[] = [
  {
    id: 'resp-001',
    request_id: 'req-001',
    vendor_id: 'vendor-001',
    vendor_name: 'Mike Rodriguez',
    vendor_company: 'Rodriguez Plumbing LLC',
    response: 'accepted',
    proposed_time: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(),
    quote_amount: 1200,
    notes: 'Can be there within the hour. Have 40 gal unit in stock.',
    responded_at: new Date(Date.now() - 15 * 60 * 1000).toISOString()
  },
  {
    id: 'resp-002',
    request_id: 'req-001',
    vendor_id: 'vendor-003',
    vendor_name: 'Tom Williams',
    vendor_company: 'Williams HVAC',
    response: 'declined',
    notes: 'Not available for plumbing work, HVAC only.',
    responded_at: new Date(Date.now() - 20 * 60 * 1000).toISOString()
  }
];

export function useVendorRequests() {
  const [requests, setRequests] = useState<VendorRequest[]>([]);
  const [responses, setResponses] = useState<VendorResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch requests
      const { data: requestsData, error: requestsError } = await supabase
        .from('vendor_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (requestsError) {
        console.warn('Supabase vendor_requests error, using mock data:', requestsError.message);
        setRequests(mockRequests);
        setResponses(mockResponses);
        return;
      }

      // Fetch responses
      const { data: responsesData, error: responsesError } = await supabase
        .from('vendor_responses')
        .select('*, vendors(name, company)')
        .order('responded_at', { ascending: false });

      if (responsesError) {
        console.warn('Supabase vendor_responses error:', responsesError.message);
      }

      if (!requestsData || requestsData.length === 0) {
        console.log('No vendor requests in DB, using mock data');
        setRequests(mockRequests);
        setResponses(mockResponses);
        return;
      }

      setRequests(requestsData.map(r => ({
        id: r.id,
        work_order_id: r.work_order_id,
        work_order_title: r.description?.substring(0, 50) || 'Vendor Request',
        property: '',
        unit: '',
        category: r.category,
        priority: r.urgency === 'emergency' ? 'emergency' : r.urgency === 'urgent' ? 'high' : 'normal',
        vendor_ids: [],
        status: r.status,
        deadline: r.deadline || '',
        created_at: r.created_at,
        selected_vendor_id: r.selected_vendor_id,
        description: r.description || ''
      })));

      if (responsesData) {
        setResponses(responsesData.map(r => ({
          id: r.id,
          request_id: r.request_id,
          vendor_id: r.vendor_id,
          vendor_name: r.vendors?.name || 'Unknown',
          vendor_company: r.vendors?.company || '',
          response: r.response === 'accept' ? 'accepted' : r.response === 'decline' ? 'declined' : r.response,
          proposed_time: r.proposed_time,
          quote_amount: r.quote_amount,
          notes: r.notes,
          responded_at: r.responded_at
        })));
      }
    } catch (err) {
      console.warn('Failed to fetch vendor requests:', err);
      setRequests(mockRequests);
      setResponses(mockResponses);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const createRequest = useCallback(async (data: {
    work_order_id: string;
    work_order_title: string;
    property: string;
    unit: string;
    category: string;
    priority: VendorRequest['priority'];
    vendor_ids: string[];
    deadline: string;
    description: string;
  }) => {
    try {
      const urgency = data.priority === 'emergency' ? 'emergency' : data.priority === 'high' ? 'urgent' : 'standard';
      
      const { data: inserted, error } = await supabase
        .from('vendor_requests')
        .insert({
          work_order_id: data.work_order_id,
          category: data.category,
          description: data.description,
          urgency,
          deadline: data.deadline || null,
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        console.error('Failed to create vendor request:', error.message);
        // Fallback to local state
        const newRequest: VendorRequest = {
          ...data,
          id: `req-${Date.now()}`,
          status: 'pending',
          created_at: new Date().toISOString()
        };
        setRequests(prev => [...prev, newRequest]);
        return newRequest;
      }

      const newRequest: VendorRequest = {
        id: inserted.id,
        work_order_id: inserted.work_order_id,
        work_order_title: data.work_order_title,
        property: data.property,
        unit: data.unit,
        category: inserted.category,
        priority: data.priority,
        vendor_ids: data.vendor_ids,
        status: 'pending',
        deadline: inserted.deadline || '',
        created_at: inserted.created_at,
        description: inserted.description || ''
      };
      setRequests(prev => [...prev, newRequest]);
      return newRequest;
    } catch (err) {
      console.error('Error creating vendor request:', err);
      throw err;
    }
  }, []);

  const selectVendor = useCallback(async (requestId: string, vendorId: string) => {
    try {
      const { error } = await supabase
        .from('vendor_requests')
        .update({ selected_vendor_id: vendorId, status: 'assigned' })
        .eq('id', requestId);

      if (error) {
        console.warn('Failed to select vendor in DB:', error.message);
      }

      setRequests(prev => prev.map(r => 
        r.id === requestId 
          ? { ...r, status: 'vendor_selected' as const, selected_vendor_id: vendorId }
          : r
      ));
    } catch (err) {
      console.warn('Error selecting vendor:', err);
      setRequests(prev => prev.map(r => 
        r.id === requestId 
          ? { ...r, status: 'vendor_selected' as const, selected_vendor_id: vendorId }
          : r
      ));
    }
  }, []);

  const cancelRequest = useCallback(async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('vendor_requests')
        .update({ status: 'cancelled' })
        .eq('id', requestId);

      if (error) {
        console.warn('Failed to cancel request in DB:', error.message);
      }

      setRequests(prev => prev.map(r => 
        r.id === requestId 
          ? { ...r, status: 'cancelled' as const }
          : r
      ));
    } catch (err) {
      console.warn('Error cancelling request:', err);
      setRequests(prev => prev.map(r => 
        r.id === requestId 
          ? { ...r, status: 'cancelled' as const }
          : r
      ));
    }
  }, []);

  const getResponsesForRequest = useCallback((requestId: string) => {
    return responses.filter(r => r.request_id === requestId);
  }, [responses]);

  const pendingRequests = requests.filter(r => r.status === 'pending' || r.status === 'responses_received');
  const pendingCount = pendingRequests.length;

  return {
    requests,
    responses,
    pendingRequests,
    pendingCount,
    loading,
    error,
    refetch: fetchRequests,
    createRequest,
    selectVendor,
    cancelRequest,
    getResponsesForRequest
  };
}
