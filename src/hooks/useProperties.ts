import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import { Database } from '../types/supabase'
import { useActivePortfolio } from '../providers/PortfolioProvider'

type Property = Database['public']['Tables']['properties']['Row']

export function useProperties() {
  const { activePortfolio } = useActivePortfolio()
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (activePortfolio?.id) {
      fetchProperties()
    } else {
      setProperties([])
      setLoading(false)
    }
  }, [activePortfolio?.id])

  async function fetchProperties() {
    if (!activePortfolio?.id) return

    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('portfolio_id', activePortfolio.id)
        .order('name')
      
      if (error) throw error
      
      setProperties(data || [])
    } catch (err) {
      setError(err as Error)
      console.error('Error fetching properties:', err)
    } finally {
      setLoading(false)
    }
  }

  return { properties, loading, error, refetch: fetchProperties }
}
