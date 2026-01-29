import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRouter, RouterProvider } from '@tanstack/react-router';
import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider } from './components/theme-provider';
import { Toaster } from './components/ui/sonner';
import { AuthProvider } from './lib/auth-context';
import { routeTree } from './routeTree.gen';

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

// Render the app
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Don't retry on authentication errors
      retry: (failureCount, error) => {
        // Don't retry on 401/403 errors
        if (error instanceof Error) {
          const message = error.message.toLowerCase();
          if (message.includes('session has expired') || 
              message.includes('access denied') ||
              message.includes('authentication required')) {
            return false;
          }
        }
        // Retry up to 2 times for other errors
        return failureCount < 2;
      },
      // Reduce stale time to detect expired sessions faster
      staleTime: 0,
      // Don't cache failed queries
      gcTime: 0,
    },
    mutations: {
      // Don't retry mutations on auth errors
      retry: (failureCount, error) => {
        if (error instanceof Error) {
          const message = error.message.toLowerCase();
          if (message.includes('session has expired') || 
              message.includes('access denied') ||
              message.includes('authentication required')) {
            return false;
          }
        }
        return failureCount < 1;
      },
    },
  },
});

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <RouterProvider router={router} />
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </StrictMode>,
  );
}
