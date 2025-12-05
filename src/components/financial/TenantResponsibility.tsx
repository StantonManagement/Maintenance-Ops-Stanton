import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { DollarSign } from 'lucide-react';

const TENANT_CHARGES = [
  { id: 1, tenant: 'Maria Lopez', unit: '205', item: 'Broken Window', amount: 250, status: 'Billed' },
  { id: 2, tenant: 'John Smith', unit: '104', item: 'Carpet Cleaning', amount: 150, status: 'Paid' },
  { id: 3, tenant: 'Sarah Connor', unit: '312', item: 'Lost Keys', amount: 50, status: 'Disputed' },
];

export function TenantResponsibility() {
  const totalRecoverable = TENANT_CHARGES.reduce((sum, item) => sum + item.amount, 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Tenant Responsibility Tracker</CardTitle>
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          ${totalRecoverable} Recoverable
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {TENANT_CHARGES.map((charge) => (
            <div key={charge.id} className="flex items-center justify-between border-b pb-2 last:border-0">
              <div className="flex items-center gap-3">
                <div className="bg-slate-100 p-2 rounded-full">
                  <DollarSign className="h-4 w-4 text-slate-600" />
                </div>
                <div>
                  <div className="font-medium">{charge.tenant} (Unit {charge.unit})</div>
                  <div className="text-sm text-muted-foreground">{charge.item}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold">${charge.amount}</div>
                <Badge 
                  variant="secondary" 
                  className={`mt-1 ${
                    charge.status === 'Paid' ? 'bg-green-100 text-green-700' : 
                    charge.status === 'Disputed' ? 'bg-red-100 text-red-700' : 
                    'bg-blue-100 text-blue-700'
                  }`}
                >
                  {charge.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
