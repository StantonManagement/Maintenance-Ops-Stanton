import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';

export interface Vendor {
  id: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  categories: string[];
  certifications: string[];
  emergency_available: boolean;
  hourly_rate: number;
  response_time_avg: number; // in minutes
  quality_score: number; // 0-100
  is_active: boolean;
  jobs_completed: number;
  acceptance_rate: number; // 0-100
  created_at: string;
}

// Mock vendor data
const mockVendors: Vendor[] = [
  {
    id: 'vendor-001',
    name: 'Mike Rodriguez',
    company: 'Rodriguez Plumbing LLC',
    phone: '(555) 123-4567',
    email: 'mike@rodriguezplumbing.com',
    categories: ['Plumbing', 'Emergency'],
    certifications: ['Licensed Plumber', 'Backflow Certified'],
    emergency_available: true,
    hourly_rate: 85,
    response_time_avg: 45,
    quality_score: 94,
    is_active: true,
    jobs_completed: 127,
    acceptance_rate: 88,
    created_at: '2023-01-15T00:00:00Z'
  },
  {
    id: 'vendor-002',
    name: 'Sarah Chen',
    company: 'Chen Electric Services',
    phone: '(555) 234-5678',
    email: 'sarah@chenelectric.com',
    categories: ['Electrical', 'Emergency'],
    certifications: ['Master Electrician', 'OSHA Certified'],
    emergency_available: true,
    hourly_rate: 95,
    response_time_avg: 60,
    quality_score: 97,
    is_active: true,
    jobs_completed: 89,
    acceptance_rate: 92,
    created_at: '2023-03-20T00:00:00Z'
  },
  {
    id: 'vendor-003',
    name: 'Tom Williams',
    company: 'Williams HVAC',
    phone: '(555) 345-6789',
    email: 'tom@williamshvac.com',
    categories: ['HVAC', 'Specialized'],
    certifications: ['EPA 608 Certified', 'NATE Certified'],
    emergency_available: false,
    hourly_rate: 110,
    response_time_avg: 180,
    quality_score: 91,
    is_active: true,
    jobs_completed: 64,
    acceptance_rate: 78,
    created_at: '2023-05-10T00:00:00Z'
  },
  {
    id: 'vendor-004',
    name: 'Lisa Park',
    company: 'Park Appliance Repair',
    phone: '(555) 456-7890',
    email: 'lisa@parkappliance.com',
    categories: ['Appliance', 'Specialized'],
    certifications: ['Factory Authorized'],
    emergency_available: false,
    hourly_rate: 75,
    response_time_avg: 240,
    quality_score: 88,
    is_active: true,
    jobs_completed: 156,
    acceptance_rate: 95,
    created_at: '2022-11-01T00:00:00Z'
  },
  {
    id: 'vendor-005',
    name: 'James Brown',
    company: 'Brown General Contracting',
    phone: '(555) 567-8901',
    email: 'james@browncontracting.com',
    categories: ['General', 'Turnover', 'Project'],
    certifications: ['General Contractor License', 'Insured'],
    emergency_available: false,
    hourly_rate: 65,
    response_time_avg: 1440,
    quality_score: 85,
    is_active: true,
    jobs_completed: 42,
    acceptance_rate: 70,
    created_at: '2023-08-15T00:00:00Z'
  },
  {
    id: 'vendor-006',
    name: 'Maria Santos',
    company: 'Santos Locksmith',
    phone: '(555) 678-9012',
    email: 'maria@santoslocksmith.com',
    categories: ['Locksmith', 'Emergency'],
    certifications: ['Certified Locksmith', 'Bonded'],
    emergency_available: true,
    hourly_rate: 90,
    response_time_avg: 30,
    quality_score: 96,
    is_active: true,
    jobs_completed: 203,
    acceptance_rate: 91,
    created_at: '2022-06-01T00:00:00Z'
  }
];

export function useVendors() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchVendors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .order('name');

      if (error) {
        console.warn('Supabase vendors error, using mock data:', error.message);
        setVendors(mockVendors);
        return;
      }

      if (!data || data.length === 0) {
        console.log('No vendors in DB, using mock data');
        setVendors(mockVendors);
        return;
      }

      setVendors(data.map(v => ({
        id: v.id,
        name: v.name,
        company: v.company || '',
        phone: v.phone,
        email: v.email || '',
        categories: v.categories || [],
        certifications: v.certifications || [],
        emergency_available: v.emergency_available || false,
        hourly_rate: v.hourly_rate || 0,
        response_time_avg: v.response_time_avg || 0,
        quality_score: v.quality_score || 0,
        is_active: v.is_active !== false,
        jobs_completed: v.jobs_completed || 0,
        acceptance_rate: v.acceptance_rate || 0,
        created_at: v.created_at
      })));
    } catch (err) {
      console.warn('Failed to fetch vendors:', err);
      setVendors(mockVendors);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  const getVendorsByCategory = useCallback((category: string) => {
    return vendors.filter(v => v.categories.includes(category) && v.is_active);
  }, [vendors]);

  const getEmergencyVendors = useCallback(() => {
    return vendors.filter(v => v.emergency_available && v.is_active);
  }, [vendors]);

  const addVendor = useCallback(async (vendor: Omit<Vendor, 'id' | 'created_at' | 'jobs_completed' | 'acceptance_rate'>) => {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .insert({
          name: vendor.name,
          company: vendor.company,
          phone: vendor.phone,
          email: vendor.email,
          categories: vendor.categories,
          certifications: vendor.certifications,
          emergency_available: vendor.emergency_available,
          hourly_rate: vendor.hourly_rate,
          quality_score: vendor.quality_score,
          response_time_avg: vendor.response_time_avg,
          is_active: vendor.is_active
        })
        .select()
        .single();

      if (error) {
        console.error('Failed to add vendor:', error.message);
        // Fallback to local state
        const newVendor: Vendor = {
          ...vendor,
          id: `vendor-${Date.now()}`,
          created_at: new Date().toISOString(),
          jobs_completed: 0,
          acceptance_rate: 0
        };
        setVendors(prev => [...prev, newVendor]);
        return newVendor;
      }

      const newVendor: Vendor = {
        id: data.id,
        name: data.name,
        company: data.company || '',
        phone: data.phone,
        email: data.email || '',
        categories: data.categories || [],
        certifications: data.certifications || [],
        emergency_available: data.emergency_available || false,
        hourly_rate: data.hourly_rate || 0,
        response_time_avg: data.response_time_avg || 0,
        quality_score: data.quality_score || 0,
        is_active: data.is_active !== false,
        jobs_completed: data.jobs_completed || 0,
        acceptance_rate: data.acceptance_rate || 0,
        created_at: data.created_at
      };
      setVendors(prev => [...prev, newVendor]);
      return newVendor;
    } catch (err) {
      console.error('Error adding vendor:', err);
      throw err;
    }
  }, []);

  const updateVendor = useCallback(async (id: string, updates: Partial<Vendor>) => {
    try {
      const { error } = await supabase
        .from('vendors')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        console.warn('Failed to update vendor in DB:', error.message);
      }

      setVendors(prev => prev.map(v => v.id === id ? { ...v, ...updates } : v));
    } catch (err) {
      console.warn('Error updating vendor:', err);
      setVendors(prev => prev.map(v => v.id === id ? { ...v, ...updates } : v));
    }
  }, []);

  const deleteVendor = useCallback(async (id: string) => {
    // Soft delete - set is_active to false
    try {
      const { error } = await supabase
        .from('vendors')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        console.warn('Failed to delete vendor in DB:', error.message);
      }

      setVendors(prev => prev.map(v => v.id === id ? { ...v, is_active: false } : v));
    } catch (err) {
      console.warn('Error deleting vendor:', err);
      setVendors(prev => prev.map(v => v.id === id ? { ...v, is_active: false } : v));
    }
  }, []);

  const activeVendors = vendors.filter(v => v.is_active);
  const emergencyVendors = vendors.filter(v => v.emergency_available && v.is_active);

  return {
    vendors,
    activeVendors,
    emergencyVendors,
    loading,
    error,
    refetch: fetchVendors,
    getVendorsByCategory,
    getEmergencyVendors,
    addVendor,
    updateVendor,
    deleteVendor
  };
}
