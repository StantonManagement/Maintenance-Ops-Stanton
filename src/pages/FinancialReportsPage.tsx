import { Section8Dashboard } from "../components/financial/Section8Dashboard";
import { TenantResponsibility } from "../components/financial/TenantResponsibility";
import { BudgetAlerts } from "../components/financial/BudgetAlerts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Button } from "../components/ui/button";
import { Download } from "lucide-react";

export default function FinancialReportsPage() {
  return (
    <div className="flex flex-col h-full bg-muted/10 overflow-y-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financial Intelligence</h1>
          <p className="text-muted-foreground">Cost tracking, budget management, and compliance reporting.</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export Financials
        </Button>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList>
          <TabsTrigger value="dashboard">Overview</TabsTrigger>
          <TabsTrigger value="section8">Section 8</TabsTrigger>
          <TabsTrigger value="budgets">Budgets & Recovery</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <BudgetAlerts />
            <TenantResponsibility />
          </div>
          <Section8Dashboard />
        </TabsContent>

        <TabsContent value="section8" className="space-y-6">
          <Section8Dashboard />
        </TabsContent>

        <TabsContent value="budgets" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <BudgetAlerts />
            <TenantResponsibility />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
