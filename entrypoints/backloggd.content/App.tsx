import { QueryClientProvider } from '@tanstack/react-query';

import ExportSection from './features/export/components/ExportSection';
import { queryClient } from './lib/react-query';
import BackloggdToasterProvider from './shared/providers/BackloggdToasterProvider';

type AppProps = {
  username: string;
};

const App = ({ username }: AppProps) => (
  <QueryClientProvider client={queryClient}>
    <BackloggdToasterProvider>
      <section id="game-transfer-section">
        <ExportSection username={username} />
      </section>
    </BackloggdToasterProvider>
  </QueryClientProvider>
);

export default App;
