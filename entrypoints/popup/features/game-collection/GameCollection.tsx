import { useTranslation } from 'react-i18next';

import Button from '@globalShared/components/Button';
import Typography from '@globalShared/components/Typography';
import FeatureSection from '@popup/components/FeatureSection';

import StatusPreferences from './StatusPreferences';
import { useExportStatusFiltersConfig } from './useExportStatusFiltersConfig';

/** Presents game collection export navigation and saved defaults. */
const GameCollection = () => {
  const { t } = useTranslation('popup', { keyPrefix: 'gameCollection' });
  const preferences = useExportStatusFiltersConfig();
  const [isNavigating, setIsNavigating] = useState(false);
  const [hasNavigationError, setHasNavigationError] = useState(false);
  const isOpening = useRef(false);

  const navigate = async () => {
    if (isOpening.current) return;
    isOpening.current = true;
    setIsNavigating(true);
    setHasNavigationError(false);
    try {
      if (!(await preferences.flush())) return;
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
          onChange={preferences.toggle}
        />
        <Typography
          as="div"
          className="mt-2 flex min-h-[18px] items-baseline gap-2"
          role="status"
          variant="caption"
        >
          <span
            className={
              preferences.hasLoadError || preferences.saveState === 'error'
                ? 'text-error'
                : 'text-content/75'
            }
          >
            {t(
              preferences.hasLoadError
                ? 'loadError'
                : !preferences.hasLoaded
                  ? 'loading'
                  : `save.${preferences.saveState}`,
            )}
          </span>
          {(preferences.hasLoadError || preferences.saveState === 'error') && (
            <button
              className="text-error shrink-0 cursor-pointer underline underline-offset-3"
              type="button"
              onClick={() => {
                if (preferences.hasLoadError) void preferences.retryLoad();
                else void preferences.flush();
              }}
            >
              {t('retry')}
            </button>
          )}
        </Typography>
      </div>
    </FeatureSection>
  );
};

export default GameCollection;
