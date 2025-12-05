import { useState } from 'react';
import { usePortfolio, Property } from '../hooks/usePortfolio';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { 
  Building2, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown,
  Clock,
  DollarSign,
  Star,
  AlertTriangle,
  ChevronRight,
  MapPin,
  Users
} from 'lucide-react';

export default function PortfolioDashboard() {
  const { 
    portfolios,
    regions,
    properties, 
    loading, 
    refetch,
    getPortfolioStats,
    getPropertyRankings
  } = usePortfolio();
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string | null>(null);

  const stats = getPortfolioStats(selectedPortfolioId || undefined);
  const topPerformers = getPropertyRankings('satisfaction_score').slice(0, 3);
  const needsAttention = getPropertyRankings('open_work_orders').slice(0, 3);

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return 'var(--status-success-text)';
    if (score >= 75) return 'var(--status-warning-text)';
    return 'var(--status-critical-text)';
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div 
        className="flex items-center justify-between px-6 py-4 border-b"
        style={{ borderColor: 'var(--border-default)' }}
      >
        <div className="flex items-center gap-3">
          <div 
            className="p-2 rounded-lg"
            style={{ backgroundColor: 'var(--action-primary-light)' }}
          >
            <Building2 size={24} style={{ color: 'var(--action-primary)' }} />
          </div>
          <div>
            <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
              Portfolio Dashboard
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {stats.total_properties} properties • {stats.total_units.toLocaleString()} units
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Portfolio Selector */}
          <div className="flex items-center gap-1 p-1 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <Button
              variant={selectedPortfolioId === null ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedPortfolioId(null)}
              className="h-7 text-xs"
            >
              All Portfolios
            </Button>
            {portfolios.map(portfolio => (
              <Button
                key={portfolio.id}
                variant={selectedPortfolioId === portfolio.id ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSelectedPortfolioId(portfolio.id)}
                className="h-7 text-xs"
              >
                {portfolio.name}
              </Button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={refetch} disabled={loading}>
            <RefreshCw size={14} className={`mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Total Units</p>
                  <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    {stats.total_units.toLocaleString()}
                  </p>
                </div>
                <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  <Users size={20} style={{ color: 'var(--action-primary)' }} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Open Work Orders</p>
                  <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    {stats.open_work_orders}
                  </p>
                </div>
                <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--status-warning-bg)' }}>
                  <AlertTriangle size={20} style={{ color: 'var(--status-warning-text)' }} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Avg Completion</p>
                  <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    {Math.round(stats.avg_completion_time)}h
                  </p>
                </div>
                <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  <Clock size={20} style={{ color: 'var(--text-secondary)' }} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Monthly Cost</p>
                  <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    ${(stats.monthly_cost / 1000).toFixed(0)}k
                  </p>
                </div>
                <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                  <DollarSign size={20} style={{ color: 'var(--status-success-text)' }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Top Performers */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp size={18} style={{ color: 'var(--status-success-text)' }} />
                Top Performers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topPerformers.map((property, index) => (
                  <div 
                    key={property.id}
                    className="flex items-center justify-between p-3 rounded-lg"
                    style={{ backgroundColor: 'var(--bg-secondary)' }}
                  >
                    <div className="flex items-center gap-3">
                      <span 
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ 
                          backgroundColor: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32',
                          color: 'white'
                        }}
                      >
                        {index + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          {property.name}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                          {property.unit_count} units
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star size={14} style={{ color: getPerformanceColor(property.satisfaction_score) }} />
                      <span className="text-sm font-bold" style={{ color: getPerformanceColor(property.satisfaction_score) }}>
                        {property.satisfaction_score}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Needs Attention */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle size={18} style={{ color: 'var(--status-warning-text)' }} />
                Needs Attention
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {needsAttention.map((property) => (
                  <div 
                    key={property.id}
                    className="flex items-center justify-between p-3 rounded-lg"
                    style={{ backgroundColor: 'var(--bg-secondary)' }}
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-6 h-6 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: 'var(--status-warning-bg)' }}
                      >
                        <AlertTriangle size={12} style={{ color: 'var(--status-warning-text)' }} />
                      </div>
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          {property.name}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                          {property.open_work_orders} open work orders
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => window.location.href = `/work-orders?property=${property.id}`}
                    >
                      <ChevronRight size={16} />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* All Properties */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">All Properties</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'var(--border-default)' }}>
                    <th className="text-left p-3 text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Property</th>
                    <th className="text-left p-3 text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Region</th>
                    <th className="text-center p-3 text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Units</th>
                    <th className="text-center p-3 text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Open WOs</th>
                    <th className="text-center p-3 text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Avg Time</th>
                    <th className="text-center p-3 text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Satisfaction</th>
                    <th className="text-right p-3 text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Monthly Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {properties
                    .filter(p => !selectedPortfolioId || p.portfolio_id === selectedPortfolioId)
                    .map(property => {
                      const region = regions.find(r => r.id === property.region_id);
                      return (
                        <tr 
                          key={property.id} 
                          className="border-b hover:bg-gray-50 cursor-pointer"
                          style={{ borderColor: 'var(--border-default)' }}
                        >
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <MapPin size={14} style={{ color: 'var(--text-tertiary)' }} />
                              <div>
                                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                  {property.name}
                                </p>
                                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                  {property.address}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <Badge variant="outline" className="text-xs">
                              {region?.name || 'Unknown'}
                            </Badge>
                          </td>
                          <td className="p-3 text-center text-sm" style={{ color: 'var(--text-primary)' }}>
                            {property.unit_count}
                          </td>
                          <td className="p-3 text-center">
                            <Badge 
                              variant={property.open_work_orders > 10 ? 'destructive' : 'secondary'}
                              className="text-xs"
                            >
                              {property.open_work_orders}
                            </Badge>
                          </td>
                          <td className="p-3 text-center text-sm" style={{ color: 'var(--text-primary)' }}>
                            {property.avg_completion_time}h
                          </td>
                          <td className="p-3 text-center">
                            <span 
                              className="text-sm font-medium"
                              style={{ color: getPerformanceColor(property.satisfaction_score) }}
                            >
                              {property.satisfaction_score}%
                            </span>
                          </td>
                          <td className="p-3 text-right text-sm" style={{ color: 'var(--text-primary)' }}>
                            ${property.monthly_cost.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
