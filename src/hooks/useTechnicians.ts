import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import { Technician } from '../types'

export function useTechnicians() {
  const [technicians, setTechnicians] = useState<Technician[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    fetchTechnicians()
  }, [])

  async function fetchTechnicians() {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await supabase
        .from('technicians')
        .select('*')
      
      if (error) {
        // If table doesn't exist, use mock data for now (Prototype fallback)
        if (error.code === '42P01') {
          console.warn('Technicians table not found, using mock data')
          setTechnicians(MOCK_TECHNICIANS)
          return
        }
        throw error
      }
      
      if (data) {
        // Transform DB data to Technician interface if needed
        // For now assuming DB columns match or using mock if empty
          if (data.length === 0) {
             setTechnicians(MOCK_TECHNICIANS)
          } else {
             // Map DB fields to Technician type
             const mapped: Technician[] = data.map((t: any) => ({
               id: t.id,
               name: t.name,
               // Map DB max_daily_workload to capacity.max
               // Current load would ideally come from a join or view, defaulting to 0 here
               capacity: { 
                 current: t.current_load || 0, 
                 max: t.max_daily_workload || 6 
               },
               skills: t.skills || [],
               currentLocation: t.current_location || 'Unknown',
               inTransit: t.status === 'in-transit',
               estimatedArrival: t.estimated_arrival,
               status: t.status || 'available',
               assignedWorkOrders: [], // Would need join to populate
               pulledForTurnover: false, // Not in core table
               turnoverInfo: undefined
             }))
             setTechnicians(mapped)
          }
      }
    } catch (err) {
      console.error('Error fetching technicians:', err)
      // Fallback to mock data on error to keep UI working
      setTechnicians(MOCK_TECHNICIANS)
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }

  return { technicians, loading, error, refetch: fetchTechnicians }
}

const MOCK_TECHNICIANS: Technician[] = [
  {
    id: "tech-1",
    name: "Ramon M.",
    capacity: { current: 4, max: 6 },
    skills: ["Plumbing", "General", "Appliance"],
    currentLocation: "Building A",
    inTransit: false,
    status: "available",
    assignedWorkOrders: [
      { id: "WO-1230", title: "Kitchen leak", status: "In Progress" },
      { id: "WO-1225", title: "Dishwasher repair", status: "Assigned" },
    ],
  },
  {
    id: "tech-2",
    name: "Sarah L.",
    capacity: { current: 5, max: 6 },
    skills: ["General", "Appliance", "Electrical"],
    currentLocation: "Building C",
    inTransit: true,
    estimatedArrival: "15 min",
    status: "in-transit",
    assignedWorkOrders: [
      { id: "WO-1228", title: "Outlet not working", status: "In Progress" },
      { id: "WO-1220", title: "Light fixture", status: "Assigned" },
      { id: "WO-1215", title: "Cabinet door", status: "Ready for Review" },
    ],
  },
  {
    id: "tech-3",
    name: "Miguel R.",
    capacity: { current: 3, max: 6 },
    skills: ["HVAC", "Plumbing", "General"],
    currentLocation: "Building B",
    inTransit: false,
    status: "available",
    assignedWorkOrders: [
      { id: "WO-1227", title: "AC not cooling", status: "In Progress" },
    ],
  },
  {
    id: "tech-4",
    name: "David K.",
    capacity: { current: 6, max: 6 },
    skills: ["General", "Paint", "Drywall"],
    currentLocation: "Building D",
    inTransit: false,
    status: "unavailable",
    assignedWorkOrders: [],
    pulledForTurnover: true,
    turnoverInfo: {
      building: "Unit 405",
      estimatedReturn: "2:00 PM"
    }
  }
];
