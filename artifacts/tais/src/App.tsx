import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { Layout } from '@/components/layout';
import { ErrorBoundary } from '@/components/error-boundary';

import ChatPage from '@/pages/chat';
import AutomationsPage from '@/pages/automations';
import PluginsPage from '@/pages/plugins';
import ModelsPage from '@/pages/models';
import PermissionsPage from '@/pages/permissions';
import LogsPage from '@/pages/logs';
import SettingsPage from '@/pages/settings';

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-primary font-mono space-y-4">
      <div className="text-6xl font-bold">404</div>
      <div className="text-xl">DESTINATION_NOT_FOUND</div>
    </div>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={ChatPage} />
        <Route path="/automations" component={AutomationsPage} />
        <Route path="/plugins" component={PluginsPage} />
        <Route path="/models" component={ModelsPage} />
        <Route path="/permissions" component={PermissionsPage} />
        <Route path="/logs" component={LogsPage} />
        <Route path="/settings" component={SettingsPage} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <Router />
          </WouterRouter>
          <Toaster theme="dark" className="font-mono" />
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
