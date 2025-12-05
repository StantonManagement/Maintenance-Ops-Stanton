import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { supabase } from '../services/supabase';

export interface Portfolio {
  id: string;
  name: string;
  owner_entity: string;
}

export interface Region {
  id: string;
  portfolio_id: string;
  name: string;
  timezone: string;
}

export interface Property {
  id: string;
  name: string;
  address: string;
  region_id: string;
  portfolio_id: string;
  unit_count: number;
  open_work_orders: number;
  avg_completion_time: number; // hours
  satisfaction_score: number; // 0-100
  monthly_cost: number;
}

export interface PortfolioStats {
  total_units: number;
  total_properties: number;
  open_work_orders: number;
  avg_completion_time: number;
  satisfaction_score: number;
  monthly_cost: number;
}

// Mock data
const mockPortfolios: Portfolio[] = [
  { id: 'portfolio-001', name: 'Hartford Properties', owner_entity: 'Hartford Realty LLC' },
  { id: 'portfolio-002', name: 'New Haven Holdings', owner_entity: 'NH Property Group' }
];

const mockRegions: Region[] = [
  { id: 'region-001', portfolio_id: 'portfolio-001', name: 'Downtown Hartford', timezone: 'America/New_York' },
  { id: 'region-002', portfolio_id: 'portfolio-001', name: 'West Hartford', timezone: 'America/New_York' },
  { id: 'region-003', portfolio_id: 'portfolio-002', name: 'New Haven Central', timezone: 'America/New_York' }
];

const mockProperties: Property[] = [
  {
    id: 'prop-001',
    name: '90 Park Street',
    address: '90 Park St, Hartford, CT 06103',
    region_id: 'region-001',
    portfolio_id: 'portfolio-001',
    unit_count: 48,
    open_work_orders: 12,
    avg_completion_time: 18,
    satisfaction_score: 87,
    monthly_cost: 24500
  },
  {
    id: 'prop-002',
    name: '101 Maple Avenue',
    address: '101 Maple Ave, Hartford, CT 06114',
    region_id: 'region-001',
    portfolio_id: 'portfolio-001',
    unit_count: 36,
    open_work_orders: 8,
    avg_completion_time: 22,
    satisfaction_score: 82,
    monthly_cost: 18200
  },
  {
    id: 'prop-003',
    name: '222 Main Street',
    address: '222 Main St, West Hartford, CT 06107',
    region_id: 'region-002',
    portfolio_id: 'portfolio-001',
    unit_count: 64,
    open_work_orders: 15,
    avg_completion_time: 16,
    satisfaction_score: 91,
    monthly_cost: 32100
  },
  {
    id: 'prop-004',
    name: '43 Frank Street',
    address: '43 Frank St, Hartford, CT 06106',
    region_id: 'region-001',
    portfolio_id: 'portfolio-001',
    unit_count: 24,
    open_work_orders: 5,
    avg_completion_time: 14,
    satisfaction_score: 94,
    monthly_cost: 11800
  },
  {
    id: 'prop-005',
    name: 'Chapel Square',
    address: '900 Chapel St, New Haven, CT 06510',
    region_id: 'region-003',
    portfolio_id: 'portfolio-002',
    unit_count: 120,
    open_work_orders: 28,
    avg_completion_time: 20,
    satisfaction_score: 85,
    monthly_cost: 58000
  }
];

// Context for property selection
interface PropertyContextType {
  selectedPropertyId: string | null;
  setSelectedPropertyId: (id: string | null) => void;
  selectedProperty: Property | null;
}

export const PropertyContext = createContext<PropertyContextType>({
  selectedPropertyId: null,
  setSelectedPropertyId: () => {},
  selectedProperty: null
});

export function usePropertyContext() {
  return useContext(PropertyContext);
}

export function usePortfolio() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPortfolioData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch portfolios
      const { data: portfoliosData, error: portfoliosError } = await supabase
        .from('portfolios')
        .select('*')
        .order('name');

      if (portfoliosError) {
        console.warn('Supabase portfolios error, using mock data:', portfoliosError.message);
        setPortfolios(mockPortfolios);
        setRegions(mockRegions);
        setProperties(mockProperties);
        return;
      }

      // Fetch regions
      const { data: regionsData, error: regionsError } = await supabase
        .from('regions')
        .select('*')
        .order('name');

      if (regionsError) {
        console.warn('Supabase regions error:', regionsError.message);
      }

      // Fetch property mappings
      const { data: propertiesData, error: propertiesError } = await supabase
        .from('property_portfolio_mapping')
        .select('*')
        .order('property_name');

      if (propertiesError) {
        console.warn('Supabase property_portfolio_mapping error:', propertiesError.message);
      }

      if (!portfoliosData || portfoliosData.length === 0) {
        console.log('No portfolios in DB, using mock data');
        setPortfolios(mockPortfolios);
        setRegions(mockRegions);
        setProperties(mockProperties);
        return;
      }

      setPortfolios(portfoliosData.map(p => ({
        id: p.id,
        name: p.name,
        owner_entity: p.description || ''
      })));

      if (regionsData && regionsData.length > 0) {
        setRegions(regionsData.map(r => ({
          id: r.id,
          portfolio_id: r.portfolio_id,
          name: r.name,
          timezone: 'America/New_York'
        })));
      } else {
        setRegions(mockRegions);
      }

      if (propertiesData && propertiesData.length > 0) {
        setProperties(propertiesData.map(p => ({
          id: p.property_id,
          name: p.property_name || p.property_id,
          address: `${p.address || ''}, ${p.city || ''}, ${p.state || 'CT'}`,
          region_id: p.region_id || '',
          portfolio_id: p.portfolio_id || '',
          unit_count: p.unit_count || 0,
          open_work_orders: 0, // Would need to calculate from work_orders
          avg_completion_time: 0,
          satisfaction_score: 85,
          monthly_cost: 0
        })));
      } else {
        setProperties(mockProperties);
      }
    } catch (err) {
      console.warn('Failed to fetch portfolio data:', err);
      setPortfolios(mockPortfolios);
      setRegions(mockRegions);
      setProperties(mockProperties);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPortfolioData();
  }, [fetchPortfolioData]);

  const getPropertiesByRegion = useCallback((regionId: string) => {
    return properties.filter(p => p.region_id === regionId);
  }, [properties]);

  const getPropertiesByPortfolio = useCallback((portfolioId: string) => {
    return properties.filter(p => p.portfolio_id === portfolioId);
  }, [properties]);

  const getPortfolioStats = useCallback((portfolioId?: string): PortfolioStats => {
    const filteredProperties = portfolioId 
      ? properties.filter(p => p.portfolio_id === portfolioId)
      : properties;
    
    return {
      total_units: filteredProperties.reduce((sum, p) => sum + p.unit_count, 0),
      total_properties: filteredProperties.length,
      open_work_orders: filteredProperties.reduce((sum, p) => sum + p.open_work_orders, 0),
      avg_completion_time: filteredProperties.length > 0
        ? filteredProperties.reduce((sum, p) => sum + p.avg_completion_time, 0) / filteredProperties.length
        : 0,
      satisfaction_score: filteredProperties.length > 0
        ? filteredProperties.reduce((sum, p) => sum + p.satisfaction_score, 0) / filteredProperties.length
        : 0,
      monthly_cost: filteredProperties.reduce((sum, p) => sum + p.monthly_cost, 0)
    };
  }, [properties]);

  const getPropertyRankings = useCallback((metric: keyof Property, ascending = false) => {
    return [...properties].sort((a, b) => {
      const aVal = a[metric] as number;
      const bVal = b[metric] as number;
      return ascending ? aVal - bVal : bVal - aVal;
    });
  }, [properties]);

  return {
    portfolios,
    regions,
    properties,
    loading,
    error,
    refetch: fetchPortfolioData,
    getPropertiesByRegion,
    getPropertiesByPortfolio,
    getPortfolioStats,
    getPropertyRankings
  };
}
