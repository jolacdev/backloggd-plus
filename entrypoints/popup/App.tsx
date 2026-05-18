import { useTranslation } from 'react-i18next';

import StatusFilters from '@globalShared/components/StatusFilters';
import Typography from '@globalShared/components/Typography';
import { useStatusFilters } from '@globalShared/hooks/useStatusFilters';

const App = () => {
  const { t } = useTranslation();
  const { filters, toggleStatusFilter } = useStatusFilters({
    canEditStorage: true,
  });

  return (
    <div className="bg-[#16181c] px-4 py-6 text-white">
      <header className="mb-6">
        <Typography variant="h2">{t('title')}</Typography>
      </header>

      <main>
        <StatusFilters filters={filters} onChange={toggleStatusFilter} />
      </main>
    </div>
  );
};

export default App;
