import { Button } from '../ui/button';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import { exportToCSV } from '../../lib/export';
import { useAnalytics } from '../../hooks/useAnalytics';

export function ReportExport() {
  const { metrics, trends, technicianStats, propertyStats } = useAnalytics();

  const handleExport = (type: 'csv' | 'pdf') => {
    if (type === 'csv') {
      // Flatten data for export
      const exportData = [
        ...trends.map(t => ({ Type: 'Trend', ...t })),
        ...technicianStats.map(t => ({ Type: 'Technician', ...t })),
        ...(propertyStats || []).map(p => ({ Type: 'Property', ...p }))
      ];
      
      exportToCSV(exportData, `analytics_report_${new Date().toISOString().split('T')[0]}`);
      toast.success('Report downloaded');
    } else {
      toast.info('PDF export coming soon');
    }
  };

  return (
    <Button variant="outline" className="gap-2" onClick={() => handleExport('csv')}>
      <Download className="h-4 w-4" />
      Export Report
    </Button>
  );
}
