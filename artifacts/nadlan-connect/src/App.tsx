import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/components/layout/language-provider";
import { AppLayout } from "@/components/layout/app-layout";
import NotFound from "@/pages/not-found";

import { AuthProvider } from "@/hooks/use-auth";
import Home from "@/pages/home";
import Auth from "@/pages/auth";
import Login from "@/pages/login";
import RegisterPromoteur from "@/pages/register-promoteur";
import RegisterAgence from "@/pages/register-agence";
import Listings from "@/pages/listings";
import ListingDetail from "@/pages/listing-detail";
import AnalyseIA from "@/pages/analyse-ia";
import Reports from "@/pages/reports";
import Cgu from "@/pages/cgu";
import Cgv from "@/pages/cgv";
import Dashboard from "@/pages/dashboard";
import DashboardProgrammes from "@/pages/dashboard-programmes";
import DashboardProgrammeEdit from "@/pages/dashboard-programme-edit";
import ProgrammeDetail from "@/pages/programme-detail";
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
      <Route path="/auth/login" component={Login} />
      <Route path="/auth/register/promoteur" component={RegisterPromoteur} />
      <Route path="/auth/register/agence" component={RegisterAgence} />
      <Route path="/listings" component={Listings} />
      <Route path="/listings/:slug" component={ListingDetail} />
      <Route path="/programme/:slug" component={ProgrammeDetail} />
      <Route path="/outils/analyse-ia" component={AnalyseIA} />
      <Route path="/outils/mes-rapports" component={Reports} />
      <Route path="/cgu" component={Cgu} />
      <Route path="/cgv" component={Cgv} />
      
      {/* Dashboard Routes */}
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/dashboard/promoteur" component={Dashboard} />
      <Route path="/dashboard/agence" component={Dashboard} />
      <Route path="/dashboard/admin" component={Admin} />
      <Route path="/dashboard/programmes" component={DashboardProgrammes} />
      <Route path="/dashboard/programmes/new" component={DashboardProgrammeEdit} />
      <Route path="/dashboard/programmes/:id/edit" component={DashboardProgrammeEdit} />
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
      <AuthProvider>
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
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;