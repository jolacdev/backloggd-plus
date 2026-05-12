import { QueryClientProvider } from '@tanstack/react-query';

import ExportSection from './features/export/components/ExportSection';
import { queryClient } from './lib/react-query';

type AppProps = {
  username: string;
};

const App = ({ username }: AppProps) => (
  <QueryClientProvider client={queryClient}>
    <section id="game-transfer-section">
      <ExportSection username={username} />
    </section>
  </QueryClientProvider>
);

export default App;
