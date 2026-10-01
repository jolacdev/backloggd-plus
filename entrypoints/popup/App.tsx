import { useTranslation } from 'react-i18next';

import FeatureTabs from './components/FeatureTabs';
import GameCollection from './features/game-collection/GameCollection';

/** Composes the popup title and available feature tabs. */
const App = () => {
  const { t } = useTranslation();
  return (
    <div className="bg-background p-3">
      <header className="text-content mb-3 flex items-center gap-3 px-2 py-1">
        <img
          alt=""
          className="size-7 shrink-0"
          height={28}
          src="/icon/96.png"
          width={28}
        />
        <h1 className="text-lg leading-6 font-semibold tracking-tight">
          Toolkittd
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
