import { QueryClient } from '@tanstack/react-query';

const STALE_TIME = 1000 * 60 * 1; // 1 minute
// const TEST_STALE_TIME = 1000 * 3; // 3 seconds

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: STALE_TIME,
    },
  },
});
