import { QueryClient } from '@tanstack/react-query';

// TODO: https://github.com/alan2207/bulletproof-react/blob/master/apps/react-vite/src/lib/api-client.ts

const STALE_TIME = 1000 * 60 * 1; // 1 minute

// TODO: Remove when not needed.
const TEST_STALE_TIME = 1000 * 5; // 5 seconds

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: STALE_TIME,
    },
  },
});
