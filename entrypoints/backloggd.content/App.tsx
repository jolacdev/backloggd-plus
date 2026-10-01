import { QueryClientProvider } from '@tanstack/react-query';

import CollectionExportSection from './features/export/components/CollectionExportSection';
import { queryClient } from './lib/react-query';
import BackloggdToasterProvider from './shared/providers/BackloggdToasterProvider';

type AppProps = {
  username: string;
};

/** Mounts the export feature with its data and toast providers. */
const App = ({ username }: AppProps) => (
  <QueryClientProvider client={queryClient}>
    <BackloggdToasterProvider>
      <section id="game-transfer-section">
        <CollectionExportSection username={username} />
      </section>
    </BackloggdToasterProvider>
  </QueryClientProvider>
);

export default App;
