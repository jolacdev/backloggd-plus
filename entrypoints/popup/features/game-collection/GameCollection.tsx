import { useTranslation } from 'react-i18next';

import Button from '@globalShared/components/Button';
import Typography from '@globalShared/components/Typography';
import { useStatusFilters } from '@globalShared/hooks/useStatusFilters';
import FeatureSection from '@popup/components/FeatureSection';

import StatusPreferences from './StatusPreferences';

/** Presents game collection export navigation and saved defaults. */
const GameCollection = () => {
  const { t } = useTranslation('popup', { keyPrefix: 'gameCollection' });
  const preferences = useStatusFilters({ canEditStorage: true });

  const openExportPage = () => {
    void browser.tabs
      .create({
        active: true,
        url: 'https://backloggd.com/settings/data/',
      })
      .then(() => window.close())
      .catch(() => undefined);
  };

  return (
    <FeatureSection
      description={t('description')}
      icon="download"
      title={t('title')}
    >
      <Button
        className="mt-3 mb-3 min-h-10 w-full"
        type="button"
        onClick={openExportPage}
      >
        {t('openExportPage')}
      </Button>
      <Typography className="text-content/75" variant="bodySmall">
        {t('instructionsBefore')}{' '}
        <strong className="text-content font-semibold">
          {t('exportLabel')}
        </strong>{' '}
        {t('instructionsAfter')}
      </Typography>
      <div className="border-border mt-4 border-t pt-3">
        <StatusPreferences
          filters={preferences.filters}
          isDisabled={!preferences.hasLoaded}
          isLoaded={preferences.hasLoaded}
          onChange={preferences.toggleStatusFilter}
        />
        <Typography className="text-content/75 mt-2" variant="caption">
          {t(preferences.hasLoaded ? 'saveHint' : 'loading')}
        </Typography>
      </div>
    </FeatureSection>
  );
};

export default GameCollection;
