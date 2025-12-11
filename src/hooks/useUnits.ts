import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import { Database } from '../types/supabase'
import { useActivePortfolio } from '../providers/PortfolioProvider'

type Unit = Database['public']['Tables']['units']['Row'] & {
  properties: {
    name: string
  } | null
}

export function useUnits(propertyId?: string) {
  const { activePortfolio } = useActivePortfolio()
  const [units, setUnits] = useState<Unit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (activePortfolio?.id) {
      fetchUnits()
    } else {
      setUnits([])
      setLoading(false)
    }
  }, [activePortfolio?.id, propertyId])

  async function fetchUnits() {
    if (!activePortfolio?.id) return

    try {
      setLoading(true)
      setError(null)
      
      let query = supabase
        .from('units')
        .select(`
          *,
          properties (name)
        `)
        .eq('portfolio_id', activePortfolio.id)
      
      if (propertyId) {
        query = query.eq('property_id', propertyId)
      }

      const { data, error } = await query.order('unit_number')
      
      if (error) throw error
      
      // Cast the result to Unit[] because Supabase types with joins can be complex to infer automatically
      setUnits((data || []) as unknown as Unit[])
    } catch (err) {
      setError(err as Error)
      console.error('Error fetching units:', err)
    } finally {
      setLoading(false)
    }
  }

  return { units, loading, error, refetch: fetchUnits }
}
