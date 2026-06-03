import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/components/layout/language-provider";
import { AppLayout } from "@/components/layout/app-layout";
import NotFound from "@/pages/not-found";

import Home from "@/pages/home";
import Auth from "@/pages/auth";
import RegisterPromoteur from "@/pages/register-promoteur";
import RegisterAgence from "@/pages/register-agence";
import Listings from "@/pages/listings";
import ListingDetail from "@/pages/listing-detail";
import Dashboard from "@/pages/dashboard";
import DashboardListingsNew from "@/pages/dashboard-listings-new";
import DashboardListingsEdit from "@/pages/dashboard-listings-edit";
import DashboardLeads from "@/pages/dashboard-leads";
import DashboardMandates from "@/pages/dashboard-mandates";
import Favorites from "@/pages/favorites";
import Leads from "@/pages/leads";
import LeadDetail from "@/pages/lead-detail";
import Admin from "@/pages/admin";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/auth" component={Auth} />
      <Route path="/auth/register/promoteur" component={RegisterPromoteur} />
      <Route path="/auth/register/agence" component={RegisterAgence} />
      <Route path="/listings" component={Listings} />
      <Route path="/listings/:slug" component={ListingDetail} />
      
      {/* Dashboard Routes */}
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/dashboard/listings/new" component={DashboardListingsNew} />
      <Route path="/dashboard/listings/:id/edit" component={DashboardListingsEdit} />
      <Route path="/dashboard/leads" component={DashboardLeads} />
      <Route path="/dashboard/mandates" component={DashboardMandates} />
      
      {/* Buyer Routes */}
      <Route path="/favorites" component={Favorites} />
      <Route path="/leads" component={Leads} />
      <Route path="/leads/:id" component={LeadDetail} />
      
      {/* Admin */}
      <Route path="/admin" component={Admin} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <AppLayout>
              <Router />
            </AppLayout>
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;