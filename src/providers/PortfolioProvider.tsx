import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase, PortfolioDB } from '../services/supabase';

interface PortfolioContextType {
  activePortfolio: PortfolioDB | null;
  setActivePortfolio: (portfolio: PortfolioDB | null) => void;
  isLoading: boolean;
  portfolios: PortfolioDB[];
  refreshPortfolios: () => Promise<void>;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const [activePortfolio, setActivePortfolio] = useState<PortfolioDB | null>(null);
  const [portfolios, setPortfolios] = useState<PortfolioDB[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPortfolios = useCallback(async () => {
    setIsLoading(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setPortfolios([]);
        return;
      }

      // Fetch portfolios user has access to
      const { data, error } = await supabase
        .from('portfolios')
        .select('*')
        .eq('active', true)
        .returns<PortfolioDB[]>();
        // Note: RLS will filter this list automatically based on portfolio_users

      if (error) {
        console.error('Error fetching portfolios:', error);
        return;
      }

      if (data) {
        setPortfolios(data);
        
        // Restore active portfolio from local storage if valid, else default to first
        const savedId = localStorage.getItem('activePortfolioId');
        const savedPortfolio = data.find(p => p.id === savedId);
        
        if (savedPortfolio) {
          setActivePortfolio(savedPortfolio);
        } else if (data.length > 0) {
          setActivePortfolio(data[0]);
        }
      }
    } catch (err) {
      console.error('Failed to init portfolios:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPortfolios();
  }, [fetchPortfolios]);

  // Persist selection
  useEffect(() => {
    if (activePortfolio) {
      localStorage.setItem('activePortfolioId', activePortfolio.id);
    } else {
      localStorage.removeItem('activePortfolioId');
    }
  }, [activePortfolio]);

  const value = {
    activePortfolio,
    setActivePortfolio,
    isLoading,
    portfolios,
    refreshPortfolios: fetchPortfolios
  };

  return (
    <PortfolioContext.Provider value={value}>
      {children}
    </PortfolioContext.Provider>
  );
}

export function useActivePortfolio() {
  const context = useContext(PortfolioContext);
  if (context === undefined) {
    throw new Error('useActivePortfolio must be used within a PortfolioProvider');
  }
  return context;
}
