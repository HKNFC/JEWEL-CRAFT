import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import ManufacturersPage from "@/pages/manufacturers";
import StoneRatesPage from "@/pages/stone-rates";
import GemstonePricesPage from "@/pages/gemstone-prices";
import AnalysisPage from "@/pages/analysis";
import ExchangeRatesPage from "@/pages/exchange-rates";
import RapaportPage from "@/pages/rapaport";
import BatchListPage from "@/pages/batch-list";
import BatchDetailPage from "@/pages/batch-detail";
import RapaportDiscountRatesPage from "@/pages/rapaport-discount-rates";
import LoginPage from "@/pages/login";
import SettingsPage from "@/pages/settings";
import AdminPage from "@/pages/admin";
import { Loader2 } from "lucide-react";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  return <Component />;
}

function AuthenticatedLayout() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between gap-2 p-3 border-b bg-background sticky top-0 z-50">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto">
            <Switch>
              <Route path="/" component={() => <ProtectedRoute component={Dashboard} />} />
              <Route path="/manufacturers" component={() => <ProtectedRoute component={ManufacturersPage} />} />
              <Route path="/stone-rates" component={() => <ProtectedRoute component={StoneRatesPage} />} />
              <Route path="/gemstone-prices" component={() => <ProtectedRoute component={GemstonePricesPage} />} />
              <Route path="/analysis" component={() => <ProtectedRoute component={AnalysisPage} />} />
              <Route path="/exchange-rates" component={() => <ProtectedRoute component={ExchangeRatesPage} />} />
              <Route path="/rapaport" component={() => <ProtectedRoute component={RapaportPage} />} />
              <Route path="/rapaport-discount-rates" component={() => <ProtectedRoute component={RapaportDiscountRatesPage} />} />
              <Route path="/batches" component={() => <ProtectedRoute component={BatchListPage} />} />
              <Route path="/batch/:id" component={() => <ProtectedRoute component={BatchDetailPage} />} />
              <Route path="/settings" component={() => <ProtectedRoute component={SettingsPage} />} />
              <Route path="/admin" component={() => <ProtectedRoute component={AdminPage} />} />
              <Route component={NotFound} />
            </Switch>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function AppRoutes() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <AuthenticatedLayout />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppRoutes />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
