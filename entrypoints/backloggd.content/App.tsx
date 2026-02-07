import ExportButton from './features/export/components/ExportButton';

type AppProps = {
  username: string;
};

const App = ({ username }: AppProps) => (
  <section id="game-transfer-section">
    <ExportButton username={username} />
    <div className="border-t border-[hsla(0,0%,100%,0.15)]"></div>
  </section>
);

export default App;
