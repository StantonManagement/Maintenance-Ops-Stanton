import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";
import WorkOrdersPage from "./pages/WorkOrdersPage";
import MessagesPage from "./pages/MessagesPage";
import ApprovalPage from "./pages/ApprovalPage";
import CalendarPage from "./pages/CalendarPage";
import TechniciansPage from "./pages/TechniciansPage";
import DispatchPage from "./pages/DispatchPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import FinancialReportsPage from "./pages/FinancialReportsPage";
import SettingsPage from "./pages/SettingsPage";
import FuturePage from "./pages/FuturePage";
import DesignPage from "./pages/DesignPage";
import OverrideHistoryPage from "./pages/OverrideHistoryPage";
import UnitProfilePage from "./pages/UnitProfilePage";
import TenantProfilePage from "./pages/TenantProfilePage";
import AISettingsPage from "./pages/AISettingsPage";
import VoiceQueuePage from "./pages/VoiceQueuePage";
import VendorsPage from "./pages/VendorsPage";
import LocationHistoryPage from "./pages/LocationHistoryPage";
import PreventiveMaintenancePage from "./pages/PreventiveMaintenancePage";
import RulesPage from "./pages/RulesPage";
import PortfolioDashboard from "./pages/PortfolioDashboard";
import TenantPortal from "./portal/TenantPortal";
import SensorDashboard from "./pages/SensorDashboard";

export default function AppRouter() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Navigate to="/work-orders" replace />} />
        
        {/* Phase 1 Routes */}
        <Route path="/work-orders" element={<WorkOrdersPage />} />
        <Route path="/work-orders/:id" element={<WorkOrdersPage />} />
        
        <Route path="/messages" element={<MessagesPage />} />
        <Route path="/messages/:id" element={<MessagesPage />} />
        
        <Route path="/approval-queue" element={<ApprovalPage />} />
        <Route path="/approval-queue/:id" element={<ApprovalPage />} />
        
        {/* Phase 2 Routes */}
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/technicians" element={<TechniciansPage />} />
        <Route path="/dispatch" element={<DispatchPage />} />
        <Route path="/voice-queue" element={<VoiceQueuePage />} />
        <Route path="/vendors" element={<VendorsPage />} />
        <Route path="/technicians/:id/location-history" element={<LocationHistoryPage />} />
        
        {/* Phase 3 Routes */}
        <Route path="/preventive-maintenance" element={<PreventiveMaintenancePage />} />
        <Route path="/rules" element={<RulesPage />} />
        <Route path="/portfolio" element={<PortfolioDashboard />} />
        <Route path="/sensors" element={<SensorDashboard />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/financials" element={<FinancialReportsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/overrides" element={<OverrideHistoryPage />} />
        <Route path="/units/:id" element={<UnitProfilePage />} />
        <Route path="/tenants/:id" element={<TenantProfilePage />} />
        <Route path="/ai-settings" element={<AISettingsPage />} />
      </Route>

      {/* Tenant Portal (separate from main layout) */}
      <Route path="/tenant-portal" element={<TenantPortal />} />

      {/* Standalone Pages (if any, but Design/Future are modals in App.tsx logic, here they are pages) */}
      {/* Ideally Design/Future should be modals or separate layouts if they don't need the sidebar */}
      {/* But sticking to routing them as pages for now is fine, they probably have their own back buttons */}
      <Route path="/future" element={<FuturePage />} />
      <Route path="/design" element={<DesignPage />} />
    </Routes>
  );
}
