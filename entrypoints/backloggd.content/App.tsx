import { QueryClientProvider } from '@tanstack/react-query';

import ExportButton from './features/export/components/ExportButton';
import { queryClient } from './lib/react-query';

type AppProps = {
  username: string;
};

const App = ({ username }: AppProps) => (
  <QueryClientProvider client={queryClient}>
    <section id="game-transfer-section">
      <ExportButton username={username} />
      <div className="border-t border-[hsla(0,0%,100%,0.15)]"></div>
    </section>
  </QueryClientProvider>
);

export default App;
