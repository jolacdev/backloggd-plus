import { useTranslation } from 'react-i18next';

import Checkbox from '@globalShared/components/Checkbox';
import Typography from '@globalShared/components/Typography';
import { preferencesStorageItem } from '@globalShared/storage';

/** Preferences that apply to the whole extension, outside feature navigation. */
const GeneralSettings = () => {
  const { t } = useTranslation('popup', { keyPrefix: 'settings' });
  const [isLoggingEnabled, setIsLoggingEnabled] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    preferencesStorageItem
      .getValue()
      .then((preferences) => {
        if (isMounted) {
          setIsLoggingEnabled(preferences?.isLoggingEnabled === true);
        }
      })
      .catch(() => {
        if (isMounted) setHasError(true);
      })
      .finally(() => {
        if (isMounted) setHasLoaded(true);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const save = async (next: boolean) => {
    setIsSaving(true);
    setHasError(false);
    try {
      await preferencesStorageItem.setValue({ isLoggingEnabled: next });
      setIsLoggingEnabled(next);
    } catch {
      setHasError(true);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="border-border bg-section rounded-lg border p-3">
      <Typography
        as="h2"
        className="mb-4 text-lg leading-6 font-semibold"
        variant="h6"
      >
        {t('title')}
      </Typography>
      <fieldset disabled={!hasLoaded || isSaving}>
        <label
          className="flex cursor-pointer items-center gap-2"
          htmlFor="console-logging"
        >
          <Checkbox
            checked={isLoggingEnabled}
            className="border-content/45 checked:border-primary checked:bg-primary checked:text-background size-[18px]"
            id="console-logging"
            onChange={(next) => {
              save(next).catch(() => undefined);
            }}
          />
          <Typography as="span" variant="bodySmall">
            {t('logging')}
          </Typography>
        </label>
        <Typography className="text-content/65 mt-1" variant="caption">
          {t('loggingHint')}
        </Typography>
      </fieldset>
      {hasError && (
        <Typography
          className="text-content/75 mt-2"
          role="status"
          variant="caption"
        >
          {t('saveError')}
        </Typography>
      )}
    </section>
  );
};

export default GeneralSettings;
