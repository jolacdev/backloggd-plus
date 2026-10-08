import { useTranslation } from 'react-i18next';

import Button from '@globalShared/components/Button';
import Checkbox from '@globalShared/components/Checkbox';
import Typography from '@globalShared/components/Typography';
import { HLTB_CATEGORIES, HltbCategory } from '@globalShared/hltb';
import { useHltbSettings } from '@globalShared/hooks/useHltbSettings';
import FeatureSection from '@popup/components/FeatureSection';

/** Configures collection badges and offers a fresh lookup by clearing saved estimates. */
const Hltb = () => {
  const { t } = useTranslation('popup', { keyPrefix: 'hltb' });
  const { t: tShared } = useTranslation('shared', {
    keyPrefix: 'features.hltb',
  });
  const { settings, updateSettings, hasError, hasLoaded, isSaving } =
    useHltbSettings();
  const [cacheStatus, setCacheStatus] = useState<
    'cleared' | 'clearing' | 'error' | 'idle'
  >('idle');
  const clear = async () => {
    setCacheStatus('clearing');
    try {
      const response: undefined | { status: string } =
        await browser.runtime.sendMessage({
          type: 'hltb:cache:clear',
        });
      setCacheStatus(response?.status === 'ok' ? 'cleared' : 'error');
    } catch {
      setCacheStatus('error');
    }
  };

  return (
    <FeatureSection
      description={t('description')}
      icon="clock-outline"
      title={t('title')}
    >
      <fieldset className="mt-4 min-w-0" disabled={!hasLoaded || isSaving}>
        <label
          className="border-border bg-border/20 flex cursor-pointer items-center gap-3 rounded-lg border p-3"
          htmlFor="hltb-enabled"
        >
          <Checkbox
            checked={settings.isEnabled}
            className="border-content/45 checked:border-primary checked:bg-primary checked:text-background size-[18px]"
            id="hltb-enabled"
            onChange={(isEnabled) => {
              updateSettings({ isEnabled }).catch(() => undefined);
            }}
          />
          <span>
            <Typography
              as="span"
              className="block font-semibold"
              variant="bodySmall"
            >
              {t('enable')}
            </Typography>
            <Typography
              as="span"
              className="text-content/65 block"
              variant="caption"
            >
              {t('enableHint')}
            </Typography>
          </span>
        </label>
        <Typography
          className="mt-4 mb-2 block"
          htmlFor="hltb-category"
          variant="labelSmall"
        >
          {t('category')}
        </Typography>
        <select
          className="border-border bg-background text-content w-full rounded-md border px-3 py-2 text-[13px]"
          id="hltb-category"
          value={settings.defaultCategory}
          onChange={(event) => {
            updateSettings({
              defaultCategory: event.target.value as HltbCategory,
            }).catch(() => undefined);
          }}
        >
          {HLTB_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {tShared(`category.${category}`)}
            </option>
          ))}
        </select>
        <Typography className="text-content/65 mt-2" variant="caption">
          {t('categoryHint')}
        </Typography>
      </fieldset>
      <Typography
        className="text-content/75 mt-3"
        role="status"
        variant="caption"
      >
        {t(hasError ? 'saveError' : hasLoaded ? 'saveHint' : 'loading')}
      </Typography>
      <div className="border-border mt-4 border-t pt-3">
        <Typography as="h3" className="font-semibold" variant="bodySmall">
          {t('cacheTitle')}
        </Typography>
        <Typography className="text-content/65 mt-1" variant="caption">
          {t('cacheHint')}
        </Typography>
        <Button
          className="mt-3 min-h-9 w-full text-[13px]"
          disabled={cacheStatus === 'clearing'}
          type="button"
          variant="secondary"
          onClick={() => {
            clear().catch(() => setCacheStatus('error'));
          }}
        >
          {t(cacheStatus === 'clearing' ? 'clearing' : 'clearCache')}
        </Button>
        {cacheStatus !== 'idle' && cacheStatus !== 'clearing' && (
          <Typography
            className="text-content/75 mt-2"
            role="status"
            variant="caption"
          >
            {t(cacheStatus === 'cleared' ? 'cacheCleared' : 'cacheError')}
          </Typography>
        )}
      </div>
    </FeatureSection>
  );
};

export default Hltb;
