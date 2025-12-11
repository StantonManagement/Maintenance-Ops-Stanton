import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/sonner";
import { ErrorBoundary } from "./components/ui/ErrorBoundary";
import AppRouter from "./AppRouter";
import { PropertyProvider } from "./providers/PropertyProvider";
import { PortfolioProvider } from "./providers/PortfolioProvider";
import { AuthProvider } from "./providers/AuthProvider";
import { RoleProvider } from "./providers/RoleProvider";
import "./index.css";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <PortfolioProvider>
            <RoleProvider>
              <PropertyProvider>
                <AppRouter />
                <Toaster />
              </PropertyProvider>
            </RoleProvider>
          </PortfolioProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </ErrorBoundary>
);
  
