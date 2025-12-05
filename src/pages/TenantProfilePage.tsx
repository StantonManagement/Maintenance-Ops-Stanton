import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../services/supabase";
import { MaintenanceBurdenScore } from "../components/tenants/MaintenanceBurdenScore";
import { LeaseRecommendation } from "../components/tenants/LeaseRecommendation";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Mail, Phone, Calendar } from "lucide-react";

export default function TenantProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTenant() {
      if (!id) return;
      try {
        const { data, error } = await supabase
          .from('tenants')
          .select(`*, unit:units(unit_number, property:properties(name))`)
          .eq('id', id)
          .single();
        
        if (error) throw error;
        setTenant(data);
      } catch (err) {
        console.error('Error fetching tenant:', err);
        // Fallback mock
        if (!tenant) {
          setTenant({
             first_name: 'Maria',
             last_name: 'Lopez',
             email: 'maria.lopez@email.com',
             phone: '(555) 987-6543',
             lease_end: '2024-08-31',
             unit: { unit_number: '205' }
          });
        }
      } finally {
        setLoading(false);
      }
    }
    fetchTenant();
  }, [id]);

  if (loading) return <div className="p-6">Loading...</div>;

  const fullName = tenant ? `${tenant.first_name} ${tenant.last_name}` : 'Tenant Profile';
  const unitInfo = tenant?.unit ? `Unit ${tenant.unit.unit_number}` : 'Unit N/A';

  return (
    <div className="flex flex-col h-full bg-muted/10 overflow-y-auto p-6 space-y-6">
      {/* Header / Profile Card */}
      <div className="bg-background rounded-lg border p-6 flex flex-col md:flex-row gap-6 items-start">
        <Avatar className="h-24 w-24">
          <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${tenant?.first_name}`} />
          <AvatarFallback>{tenant?.first_name?.[0]}{tenant?.last_name?.[0]}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{fullName}</h1>
          <div className="text-muted-foreground mb-4">{unitInfo} • Resident since 2019</div>
          
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{tenant?.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{tenant?.phone}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Lease Ends: {tenant?.lease_end}</span>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview & Insights</TabsTrigger>
          <TabsTrigger value="history">Request History</TabsTrigger>
          <TabsTrigger value="documents">Lease Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <MaintenanceBurdenScore 
              score="High" 
              trend="up" 
              requestCount={14} 
              avgCost={320} 
            />
            <LeaseRecommendation 
              type="review" 
              confidence={78} 
              factors={[
                "Consistent rent payments",
                "High volume of minor maintenance requests",
                "2 incidents of tenant-caused damage",
                "Good communication responsiveness"
              ]}
            />
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">Financial Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Total Rent Paid</span>
                    <span className="font-medium">$58,400</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Maintenance Cost</span>
                    <span className="font-medium text-amber-600">$4,250</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between text-sm font-medium">
                    <span>Net Value</span>
                    <span>$54,150</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <div className="text-sm text-muted-foreground p-4">Request history view coming soon.</div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
