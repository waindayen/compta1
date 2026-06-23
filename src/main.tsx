import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { BetSlipProvider } from './contexts/BetSlipContext';
import { ConnectionProvider } from './contexts/ConnectionContext';
import App from './App.tsx';
import './index.css';
import './styles/print.css';
import { ServerTimeService } from './services/serverTime';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000,
    },
  },
});

// Initialiser le service de synchronisation avec l'heure du serveur
ServerTimeService.initialize();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ConnectionProvider>
          <BetSlipProvider>
            <App />
          </BetSlipProvider>
        </ConnectionProvider>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>
);