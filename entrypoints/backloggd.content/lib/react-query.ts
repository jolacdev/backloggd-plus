import { QueryClient } from '@tanstack/react-query';

const STALE_TIME = 1000 * 60 * 1; // 1 minute
const GARBAGE_COLLECTION_TIME = 1000 * 60 * 1; // 1 minute

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: GARBAGE_COLLECTION_TIME, // Time until data is removed from cache memory.
      refetchOnReconnect: false, // Prevents re-fetching already-settled queries after a brief network disconnection.
      refetchOnWindowFocus: false, // Prevents re-fetching already-settled queries when the user switches tabs.
      staleTime: STALE_TIME, // Time until data is considered stale.
    },
  },
});
