import { useState, useCallback } from 'react';
import { supabase } from '../services/supabase';
import type { VendorRequest, VendorResponse } from '../types';
import { toast } from 'sonner';

export function useVendorRequests() {
  const [requests, setRequests] = useState<VendorRequest[]>([]);
  const [responses, setResponses] = useState<VendorResponse[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchVendorRequests = useCallback(async (workOrderId?: string) => {
    try {
      setLoading(true);
      let query = supabase
        .from('v_vendor_requests_with_responses')
        .select('*')
        .order('created_at', { ascending: false });

      if (workOrderId) {
        query = query.eq('work_order_id', workOrderId);
      }

      const { data, error } = await query;

      if (error) throw error;

      setRequests((data || []).map(mapRequest));
    } catch (err) {
      console.error('Error fetching vendor requests:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRequestResponses = useCallback(async (requestId: string) => {
    try {
      const { data, error } = await supabase
        .from('vendor_responses')
        .select(`
          *,
          vendors (
            name,
            company
          )
        `)
        .eq('request_id', requestId);

      if (error) throw error;

      setResponses((data || []).map(mapResponse));
    } catch (err) {
      console.error('Error fetching responses:', err);
    }
  }, []);

  const createVendorRequest = useCallback(async (data: {
    workOrderId: string;
    category: string;
    urgency: string;
    requestDetails: string;
    maxBudget?: number;
    responseDeadline: string;
    buildingAccessInfo?: string;
  }) => {
    try {
      const { error } = await supabase
        .from('vendor_requests')
        .insert({
          work_order_id: data.workOrderId,
          category: data.category,
          urgency: data.urgency,
          request_details: data.requestDetails,
          max_budget: data.maxBudget,
          response_deadline: data.responseDeadline,
          building_access_info: data.buildingAccessInfo,
          status: 'pending',
          created_by: 'Kristine' // Mock user
        });

      if (error) throw error;
      toast.success('Vendor request sent');
      return true;
    } catch (err) {
      console.error('Error creating vendor request:', err);
      toast.error('Failed to send request');
      return false;
    }
  }, []);

  const selectVendor = useCallback(async (requestId: string, vendorId: string) => {
    try {
      const { error } = await supabase
        .from('vendor_requests')
        .update({ 
          status: 'vendor_selected',
          selected_vendor_id: vendorId
        })
        .eq('id', requestId);

      if (error) throw error;
      
      // Also update response status
      await supabase
        .from('vendor_responses')
        .update({ response_status: 'accepted' })
        .eq('request_id', requestId)
        .eq('vendor_id', vendorId);

      toast.success('Vendor selected successfully');
      fetchVendorRequests();
      return true;
    } catch (err) {
      console.error('Error selecting vendor:', err);
      toast.error('Failed to select vendor');
      return false;
    }
  }, [fetchVendorRequests]);

  const cancelRequest = useCallback(async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('vendor_requests')
        .update({ status: 'cancelled' })
        .eq('id', requestId);

      if (error) throw error;
      toast.success('Request cancelled');
      fetchVendorRequests();
      return true;
    } catch (err) {
      console.error('Error cancelling request:', err);
      toast.error('Failed to cancel request');
      return false;
    }
  }, [fetchVendorRequests]);

  const getQualifiedVendors = useCallback(async (category: string) => {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .contains('categories', [category])
        .eq('is_active', true);

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error finding vendors:', err);
      return [];
    }
  }, []);

  return {
    requests,
    responses,
    loading,
    fetchVendorRequests,
    fetchRequestResponses,
    createVendorRequest,
    selectVendor,
    cancelRequest,
    getQualifiedVendors
  };
}

function mapRequest(row: any): VendorRequest {
  return {
    id: row.id,
    workOrderId: row.work_order_id,
    category: row.category,
    urgency: row.urgency,
    status: row.status,
    requestDetails: row.request_details,
    maxBudget: row.max_budget,
    responseDeadline: row.response_deadline,
    buildingAccessInfo: row.building_access_info,
    selectedVendorId: row.selected_vendor_id,
    responseCount: row.response_count || 0,
    lowestQuote: row.lowest_quote,
    createdBy: row.created_by,
    createdAt: row.created_at
  };
}

function mapResponse(row: any): VendorResponse {
  return {
    id: row.id,
    requestId: row.request_id,
    vendorId: row.vendor_id,
    vendorName: row.vendors?.company || row.vendors?.name || 'Unknown Vendor',
    responseStatus: row.response_status,
    proposedTimeline: row.proposed_timeline,
    quotedAmount: row.quoted_amount,
    declineReason: row.decline_reason,
    notes: row.notes,
    respondedAt: row.responded_at
  };
}
