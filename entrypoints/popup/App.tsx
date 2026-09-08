import { useTranslation } from 'react-i18next';

import HltbSettings from '@globalShared/components/HltbSettings';
import StatusFilters from '@globalShared/components/StatusFilters';
import Typography from '@globalShared/components/Typography';
import { useHltbSettings } from '@globalShared/hooks/useHltbSettings';
import { useStatusFilters } from '@globalShared/hooks/useStatusFilters';

const App = () => {
  const { t } = useTranslation();
  const { filters, toggleStatusFilter, hasLoadedStatuses } = useStatusFilters({
    canEditStorage: true,
  });
  const { settings, updateSettings, hasLoadedSettings } = useHltbSettings({
    canEditStorage: true,
  });

  if (!hasLoadedStatuses || !hasLoadedSettings) return;

  return (
    <div className="bg-[#16181c] px-4 py-6 text-white">
      <header className="mb-6">
        <Typography variant="h2">{t('title')}</Typography>
      </header>

      <main className="flex flex-col gap-6">
        <StatusFilters filters={filters} onChange={toggleStatusFilter} />

        <div className="border-t border-[var(--back-field-border,#3b414e)] pt-6">
          <HltbSettings settings={settings} onChange={updateSettings} />
        </div>
      </main>
    </div>
  );
};

export default App;
