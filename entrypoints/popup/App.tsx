import { useTranslation } from 'react-i18next';

import FeatureTabs from './components/FeatureTabs';
import GameCollection from './features/game-collection/GameCollection';

/** Composes the popup title and available feature tabs. */
const App = () => {
  const { t } = useTranslation();
  return (
    <div className="bg-background p-3">
      <header className="text-content mb-2 text-lg leading-6 font-semibold">
        <h1>
          Backloggd<span className="text-primary">+</span>
        </h1>
      </header>

      <main>
        <FeatureTabs
          tabs={[
            {
              id: 'game-collection',
              content: <GameCollection />,
              icon: 'download',
              label: t('gameCollection.title'),
            },
          ]}
        />
      </main>
    </div>
  );
};

export default App;
