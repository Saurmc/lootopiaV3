import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '../i18n';
import RootNavigator from '../navigation/RootNavigator';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

/**
 * AppEntry — point d'entrée de l'application Lootopia.
 * Fournit le QueryClient (TanStack Query) et la navigation.
 */
export default function AppEntry() {
  return (
    <QueryClientProvider client={queryClient}>
      <RootNavigator />
    </QueryClientProvider>
  );
}
