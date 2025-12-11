import { useState } from 'react';
import { useVendors } from '../hooks/useVendors';
import { useVendorRequests } from '../hooks/useVendorRequests';
import { VendorCard } from '../components/vendors/VendorCard';
import { AddVendorModal } from '../components/vendors/AddVendorModal';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  Users, 
  Search, 
  Plus, 
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Building
} from 'lucide-react';
import { toast } from 'sonner';

export default function VendorsPage() {
  const { vendors, loading, refetch, activeVendors, emergencyVendors } = useVendors();
  const { pendingRequests, getResponsesForRequest, selectVendor } = useVendorRequests();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [isAddVendorOpen, setIsAddVendorOpen] = useState(false);
  
  const categories = [...new Set(vendors.flatMap(v => v.categories))];

  const filteredVendors = activeVendors.filter(v => {
    const matchesSearch = searchQuery === '' || 
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.company.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !categoryFilter || v.categories.includes(categoryFilter);
    return matchesSearch && matchesCategory;
  });

  const handleSelectVendor = async (requestId: string, vendorId: string) => {
    await selectVendor(requestId, vendorId);
    toast.success('Vendor selected successfully');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-xs"><Clock size={12} className="mr-1" />Awaiting Responses</Badge>;
      case 'responses_received':
        return <Badge variant="default" className="text-xs"><AlertCircle size={12} className="mr-1" />Responses Ready</Badge>;
      case 'vendor_selected':
        return <Badge className="text-xs bg-green-600"><CheckCircle size={12} className="mr-1" />Vendor Selected</Badge>;
      case 'cancelled':
        return <Badge variant="destructive" className="text-xs"><XCircle size={12} className="mr-1" />Cancelled</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">{status}</Badge>;
    }
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
            <Building size={24} style={{ color: 'var(--action-primary)' }} />
          </div>
          <div>
            <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
              Vendor Management
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {activeVendors.length} active vendors • {emergencyVendors.length} emergency available
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refetch} disabled={loading}>
            <RefreshCw size={14} className={`mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setIsAddVendorOpen(true)}>
            <Plus size={14} className="mr-1" />
            Add Vendor
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="directory" className="h-full flex flex-col">
          <div className="px-6 pt-4 border-b" style={{ borderColor: 'var(--border-default)' }}>
            <TabsList>
              <TabsTrigger value="directory">
                <Users size={14} className="mr-1" />
                Directory
              </TabsTrigger>
              <TabsTrigger value="requests">
                <Clock size={14} className="mr-1" />
                Active Requests
                {pendingRequests.length > 0 && (
                  <Badge variant="destructive" className="ml-2 h-5 px-1.5">
                    {pendingRequests.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="directory" className="flex-1 overflow-y-auto p-6 mt-0">
            {/* Filters */}
            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex-1 max-w-sm">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }} />
                <Input 
                  placeholder="Search vendors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex items-center gap-1 p-1 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <Button
                  variant={categoryFilter === null ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setCategoryFilter(null)}
                  className="h-7 text-xs"
                >
                  All
                </Button>
                {categories.slice(0, 5).map(cat => (
                  <Button
                    key={cat}
                    variant={categoryFilter === cat ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setCategoryFilter(cat)}
                    className="h-7 text-xs"
                  >
                    {cat}
                  </Button>
                ))}
              </div>
            </div>

            {/* Vendor Grid */}
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <RefreshCw size={32} className="animate-spin" style={{ color: 'var(--text-tertiary)' }} />
              </div>
            ) : filteredVendors.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 gap-3">
                <Users size={48} style={{ color: 'var(--text-tertiary)' }} />
                <p style={{ color: 'var(--text-secondary)' }}>No vendors found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredVendors.map(vendor => (
                  <VendorCard 
                    key={vendor.id} 
                    vendor={vendor}
                    onViewDetails={() => toast.info(`View details for ${vendor.name}`)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="requests" className="flex-1 overflow-y-auto p-6 mt-0">
            {pendingRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 gap-3">
                <CheckCircle size={48} style={{ color: 'var(--status-success-text)' }} />
                <p style={{ color: 'var(--text-secondary)' }}>No pending vendor requests</p>
              </div>
            ) : (
              <div className="space-y-4 max-w-4xl">
                {pendingRequests.map(request => {
                  const responses = getResponsesForRequest(request.id);
                  
                  return (
                    <Card key={request.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-base">{request.work_order_title}</CardTitle>
                            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                              {request.property} • {request.unit}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={request.priority === 'emergency' ? 'destructive' : 'secondary'}>
                              {request.priority}
                            </Badge>
                            {getStatusBadge(request.status)}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm mb-4" style={{ color: 'var(--text-primary)' }}>
                          {request.description}
                        </p>

                        {/* Responses */}
                        {responses.length > 0 && (
                          <div className="space-y-2 mb-4">
                            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                              Vendor Responses ({responses.length})
                            </p>
                            {responses.map(response => (
                              <div 
                                key={response.id}
                                className="p-3 rounded-lg border flex items-center justify-between"
                                style={{ 
                                  backgroundColor: response.response === 'accepted' ? 'var(--status-success-bg)' : 'var(--bg-secondary)',
                                  borderColor: response.response === 'accepted' ? 'var(--status-success-border)' : 'var(--border-default)'
                                }}
                              >
                                <div>
                                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                    {response.vendor_name}
                                  </p>
                                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                    {response.vendor_company}
                                  </p>
                                  {response.notes && (
                                    <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                                      "{response.notes}"
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-center gap-3">
                                  {response.quote_amount && (
                                    <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                                      ${response.quote_amount}
                                    </span>
                                  )}
                                  {response.response === 'accepted' ? (
                                    <Button 
                                      size="sm"
                                      onClick={() => handleSelectVendor(request.id, response.vendor_id)}
                                    >
                                      Select
                                    </Button>
                                  ) : response.response === 'declined' ? (
                                    <Badge variant="secondary">Declined</Badge>
                                  ) : (
                                    <Badge variant="outline">Pending</Badge>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Deadline */}
                        <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: 'var(--border-default)' }}>
                          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                            Response deadline: {new Date(request.deadline).toLocaleString()}
                          </span>
                          <Button variant="ghost" size="sm">
                            Cancel Request
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <AddVendorModal 
        isOpen={isAddVendorOpen} 
        onClose={() => setIsAddVendorOpen(false)} 
      />
    </div>
  );
}
