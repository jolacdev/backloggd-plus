import { useTranslation } from 'react-i18next';

import Icon from '@globalShared/components/Icon';
import Typography from '@globalShared/components/Typography';
import { cn } from '@globalShared/utils/cn';

import FeatureTabs from './components/FeatureTabs';
import GeneralSettings from './components/GeneralSettings';
import GameCollection from './features/game-collection/GameCollection';
import Hltb from './features/hltb/Hltb';

/** Switches between feature tabs and general settings inside the popup. */
const App = () => {
  const { t } = useTranslation();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const navigationLabel = t(
    isSettingsOpen ? 'settings.aria.back' : 'settings.aria.open',
  );
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
        <button
          aria-label={navigationLabel}
          className={cn(
            'ml-auto flex min-h-8 min-w-8 cursor-pointer items-center justify-center gap-1 rounded-md px-1.5',
            'text-content/75 hover:bg-border/40 hover:text-content',
          )}
          title={navigationLabel}
          type="button"
          onClick={() => setIsSettingsOpen(!isSettingsOpen)}
        >
          <Icon name={isSettingsOpen ? 'arrow-left' : 'cog-outline'} />
          {isSettingsOpen && (
            <Typography as="span" variant="bodySmall">
              {t('settings.back')}
            </Typography>
          )}
        </button>
      </header>

      <main>
        <div hidden={isSettingsOpen}>
          <FeatureTabs
            tabs={[
              {
                id: 'game-collection',
                content: <GameCollection />,
                icon: 'download',
                label: t('gameCollection.title'),
              },
              {
                id: 'hltb',
                content: <Hltb />,
                icon: 'clock-outline',
                label: t('hltb.title'),
              },
            ]}
          />
        </div>
        <div hidden={!isSettingsOpen}>
          <GeneralSettings />
        </div>
      </main>
    </div>
  );
};

export default App;
