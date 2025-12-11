import { useEffect, useState } from 'react';
import { supabase, TABLES } from '../services/supabase';
import { 
  calculateAvgResponseTime, 
  calculateTenantSatisfaction, 
  calculateOverdueCount,
  getPropertyPerformance,
  getBudgetStatus,
  PropertyStats,
  BudgetStatus
} from '../services/analyticsService';

export interface AnalyticsMetrics {
  completionRate: { value: string; trend: 'up' | 'down' | 'neutral'; trendValue: string };
  avgResponseTime: { value: string; trend: 'up' | 'down' | 'neutral'; trendValue: string };
  tenantSatisfaction: { value: '0.0', trend: 'neutral', trendValue: '0.0' },
  overdueOrders: { value: string; trend: 'up' | 'down' | 'neutral'; trendValue: string };
}

export interface TrendData {
  date: string;
  created: number;
  completed: number;
  emergency: number;
  high: number;
  normal: number;
}

export interface TechnicianStat {
  id: string;
  name: string;
  completed: number;
  firstTimeFixRate: number;
  avgTime: string;
  rating: number;
}

export function useAnalytics() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<AnalyticsMetrics>({
    completionRate: { value: '0%', trend: 'neutral', trendValue: '0%' },
    avgResponseTime: { value: '0h', trend: 'neutral', trendValue: '0h' },
    tenantSatisfaction: { value: '0.0', trend: 'neutral', trendValue: '0.0' },
    overdueOrders: { value: '0', trend: 'neutral', trendValue: '0' },
  });
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [technicianStats, setTechnicianStats] = useState<TechnicianStat[]>([]);
  const [propertyStats, setPropertyStats] = useState<PropertyStats[]>([]);
  const [budgetStats, setBudgetStats] = useState<BudgetStatus[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);

        // 1. Fetch Work Orders
        const { data: wos, error: woError } = await supabase
          .from(TABLES.WORK_ORDERS)
          .select('*')
          .gte('CreatedAt', thirtyDaysAgo.toISOString());

        if (woError) throw woError;

        // 2. Fetch Assignments for technician stats
        const { data: assignments, error: assignError } = await supabase
          .from('work_order_assignments')
          .select('*, technician:technicians(name)')
          .gte('created_at', thirtyDaysAgo.toISOString());

        if (assignError) throw assignError;

        // --- Calculate Metrics ---
        // Typing wos as any[] temporarily if inference fails, or relying on it working
        const workOrders = wos || [];
        const total = workOrders.length;
        const completed = workOrders.filter((w: any) => w.Status === 'Completed').length;
        
        // Calculate Real Metrics via Service
        const responseTime = await calculateAvgResponseTime(30);
        const satisfaction = await calculateTenantSatisfaction(30);
        const overdueCount = await calculateOverdueCount({
          emergency: 2,
          high: 24,
          medium: 72,
          low: 168
        });
        
        setMetrics({
          completionRate: { 
            value: total ? `${Math.round((completed / total) * 100)}%` : '0%', 
            trend: 'up', 
            trendValue: '+2%' 
          },
          avgResponseTime: { value: responseTime, trend: 'neutral', trendValue: '0h' },
          tenantSatisfaction: { value: satisfaction as any, trend: 'neutral', trendValue: '0.0' },
          overdueOrders: { 
            value: overdueCount.toString(), 
            trend: overdueCount > 5 ? 'down' : 'up', 
            trendValue: overdueCount > 0 ? `+${overdueCount}` : '0' 
          },
        });

        // --- Calculate Trends (Last 7 Days) ---
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          return d.toISOString().split('T')[0];
        });

        const trendData = last7Days.map(date => {
          const dayWos = workOrders.filter((w: any) => w.CreatedAt?.startsWith(date));
          return {
            date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
            created: dayWos.length,
            completed: dayWos.filter((w: any) => w.Status === 'Completed').length,
            emergency: dayWos.filter((w: any) => w.Priority?.toLowerCase() === 'emergency').length,
            high: dayWos.filter((w: any) => w.Priority?.toLowerCase() === 'high').length,
            normal: dayWos.filter((w: any) => ['normal', 'low'].includes(w.Priority?.toLowerCase() || '')).length,
          };
        });
        setTrends(trendData);

        // --- Calculate Technician Stats ---
        const techMap = new Map<string, TechnicianStat>();
        assignments?.forEach((a: any) => {
          if (!a.technician_id) return;
          const current = techMap.get(a.technician_id) || {
            id: a.technician_id,
            name: a.technician?.name || 'Unknown',
            completed: 0,
            firstTimeFixRate: 90, // Mock baseline
            avgTime: '2h',
            rating: 4.8
          };
          
          if (a.status === 'completed') {
            current.completed += 1;
          }
          techMap.set(a.technician_id, current);
        });

        setTechnicianStats(Array.from(techMap.values()).sort((a, b) => b.completed - a.completed).slice(0, 5));

        // Fetch new real data
        setPropertyStats(await getPropertyPerformance());
        setBudgetStats(await getBudgetStatus());

      } catch (err) {
        console.error('Analytics fetch error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return { metrics, trends, technicianStats, propertyStats, budgetStats, loading };
}
