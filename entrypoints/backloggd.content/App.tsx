import { QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

import { queryClient } from './lib/react-query';
import BackloggdToasterProvider from './shared/providers/BackloggdToasterProvider';

type AppProps = {
  children: ReactNode;
};

/**
 * Shared provider stack for every shadow root the content script mounts.
 *
 * Each feature renders in its own shadow root with its own React root, but they
 * all share a single `queryClient` instance so caches are not duplicated.
 */
const App = ({ children }: AppProps) => (
  <QueryClientProvider client={queryClient}>
    <BackloggdToasterProvider>{children}</BackloggdToasterProvider>
  </QueryClientProvider>
);

export default App;
