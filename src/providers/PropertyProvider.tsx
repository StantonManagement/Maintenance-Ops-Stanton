import { useState, useMemo, ReactNode } from 'react';
import { PropertyContext, usePortfolio } from '../hooks/usePortfolio';

interface PropertyProviderProps {
  children: ReactNode;
}

export function PropertyProvider({ children }: PropertyProviderProps) {
  const { properties } = usePortfolio();
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);

  const selectedProperty = useMemo(() => {
    if (!selectedPropertyId) return null;
    return properties.find(p => p.id === selectedPropertyId) || null;
  }, [selectedPropertyId, properties]);

  const value = useMemo(() => ({
    selectedPropertyId,
    setSelectedPropertyId,
    selectedProperty
  }), [selectedPropertyId, selectedProperty]);

  return (
    <PropertyContext.Provider value={value}>
      {children}
    </PropertyContext.Provider>
  );
}
