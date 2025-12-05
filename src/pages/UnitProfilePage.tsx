import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../services/supabase";
import { EquipmentInventory } from "../components/units/EquipmentInventory";
import { PredictiveReplacement } from "../components/units/PredictiveReplacement";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { History, Camera } from "lucide-react";

export default function UnitProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [unit, setUnit] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUnit() {
      if (!id) return;
      try {
        const { data, error } = await supabase
          .from('units')
          .select(`*, property:properties(name)`)
          .eq('id', id)
          .single();

        if (error) throw error;
        setUnit(data);
      } catch (err) {
        console.error('Error fetching unit:', err);
        // Fallback to mock for dev if DB not ready
        if (!unit) {
           setUnit({
             unit_number: '205',
             floor_plan: '2 Bed / 2 Bath',
             property: { name: 'Building A' }
           });
        }
      } finally {
        setLoading(false);
      }
    }
    fetchUnit();
  }, [id]);

  if (loading) return <div className="p-6">Loading...</div>;

  const unitTitle = unit ? `Unit ${unit.unit_number} Profile` : 'Unit Profile';
  const subTitle = unit ? `${unit.property?.name} • ${unit.floor_plan}` : 'Loading...';

  return (
    <div className="flex flex-col h-full bg-muted/10 overflow-y-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{unitTitle}</h1>
          <p className="text-muted-foreground">{subTitle}</p>
        </div>
      </div>

      <Tabs defaultValue="equipment" className="space-y-6">
        <TabsList>
          <TabsTrigger value="equipment">Equipment & Assets</TabsTrigger>
          <TabsTrigger value="history">Maintenance History</TabsTrigger>
          <TabsTrigger value="inspections">Inspections</TabsTrigger>
        </TabsList>

        <TabsContent value="equipment" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2">
              <EquipmentInventory />
            </div>
            <div>
              <PredictiveReplacement />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Work Order History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">History view coming soon (Phase 3 extension)</div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inspections" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Inspection Logs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">Inspection logs view coming soon (Phase 3 extension)</div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
