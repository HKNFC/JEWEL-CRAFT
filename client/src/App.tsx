import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
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

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/manufacturers" component={ManufacturersPage} />
      <Route path="/stone-rates" component={StoneRatesPage} />
      <Route path="/gemstone-prices" component={GemstonePricesPage} />
      <Route path="/analysis" component={AnalysisPage} />
      <Route path="/exchange-rates" component={ExchangeRatesPage} />
      <Route path="/rapaport" component={RapaportPage} />
      <Route path="/batches" component={BatchListPage} />
      <Route path="/batch/:id" component={BatchDetailPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SidebarProvider style={style as React.CSSProperties}>
          <div className="flex h-screen w-full">
            <AppSidebar />
            <div className="flex flex-col flex-1 overflow-hidden">
              <header className="flex items-center justify-between gap-2 p-3 border-b bg-background sticky top-0 z-50">
                <SidebarTrigger data-testid="button-sidebar-toggle" />
                <ThemeToggle />
              </header>
              <main className="flex-1 overflow-auto">
                <Router />
              </main>
            </div>
          </div>
        </SidebarProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
