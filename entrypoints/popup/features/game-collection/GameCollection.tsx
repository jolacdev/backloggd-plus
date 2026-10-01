import { useTranslation } from 'react-i18next';

import Button from '@globalShared/components/Button';
import Typography from '@globalShared/components/Typography';
import FeatureSection from '@popup/components/FeatureSection';

import StatusPreferences from './StatusPreferences';
import { useExportStatusFiltersConfig } from './useExportStatusFiltersConfig';

const getPreferenceStatusKey = ({
  saveState,
  hasLoaded,
  hasLoadError,
}: ReturnType<typeof useExportStatusFiltersConfig>) => {
  if (hasLoadError) return 'loadError';
  if (!hasLoaded) return 'loading';
  return `save.${saveState}`;
};

/** Presents game collection export navigation and saved defaults. */
const GameCollection = () => {
  const { t } = useTranslation('popup', { keyPrefix: 'gameCollection' });
  const preferences = useExportStatusFiltersConfig();
  const [isNavigating, setIsNavigating] = useState(false);
  const [hasNavigationError, setHasNavigationError] = useState(false);
  const isOpening = useRef(false);

  const preferenceStatusKey = getPreferenceStatusKey(preferences);

  const navigate = async () => {
    if (isOpening.current) return;
    isOpening.current = true;
    setIsNavigating(true);
    setHasNavigationError(false);
    try {
      if (!(await preferences.savePendingPreferences())) return;
      await browser.tabs.create({
        active: true,
        url: 'https://backloggd.com/settings/data/',
      });
      window.close();
    } catch {
      setHasNavigationError(true);
    } finally {
      isOpening.current = false;
      setIsNavigating(false);
    }
  };

  return (
    <FeatureSection
      description={t('description')}
      icon="download"
      title={t('title')}
    >
      <Button
        className="mt-3 mb-3 min-h-10 w-full"
        disabled={!preferences.hasLoaded || isNavigating}
        type="button"
        onClick={navigate}
      >
        {t(isNavigating ? 'opening' : 'action')}
      </Button>
      <Typography className="text-content/75" variant="bodySmall">
        {t('instructionsBefore')}{' '}
        <strong className="text-content font-semibold">
          {t('exportLabel')}
        </strong>{' '}
        {t('instructionsAfter')}
      </Typography>
      {hasNavigationError && (
        <Typography className="text-error" role="status" variant="bodySmall">
          {t('navigationError')}
        </Typography>
      )}
      <div className="border-border mt-4 border-t pt-3">
        <StatusPreferences
          filters={preferences.filters}
          isDisabled={!preferences.hasLoaded || isNavigating}
          isLoaded={preferences.hasLoaded}
          onChange={preferences.toggleStatusFilter}
        />
        <Typography
          className={
            preferences.hasLoadError || preferences.saveState === 'error'
              ? 'text-error mt-2 min-h-[18px]'
              : 'text-content/75 mt-2 min-h-[18px]'
          }
          role="status"
          variant="caption"
        >
          {t(preferenceStatusKey)}
        </Typography>
      </div>
    </FeatureSection>
  );
};

export default GameCollection;
