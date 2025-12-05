import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "sonner";
import AppRouter from "./AppRouter";
import { PropertyProvider } from "./providers/PropertyProvider";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <PropertyProvider>
      <AppRouter />
      <Toaster position="top-right" richColors />
    </PropertyProvider>
  </BrowserRouter>
);
  
