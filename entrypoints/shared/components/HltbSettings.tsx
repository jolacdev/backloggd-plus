import { useTranslation } from 'react-i18next';

import Checkbox from '@globalShared/components/Checkbox';
import Typography from '@globalShared/components/Typography';
import {
  HLTB_CATEGORIES,
  HltbCategory,
  HltbSettings as HltbSettingsState,
} from '@globalShared/types/hltb';
import { cn } from '@globalShared/utils/cn';

const DEFAULT_CATEGORY_SELECT_ID = 'hltb-default-category';

type HltbSettingsProps = {
  settings: HltbSettingsState;
  onChange: (patch: Partial<HltbSettingsState>) => void;
};

/**
 * Two settings, both of which earn their place: an off switch, and which time the badge
 * shows by default. Badge position is deliberately not configurable — the corner overlay
 * is the only placement that works across every library route variant.
 */
const HltbSettings = ({ onChange, settings }: HltbSettingsProps) => {
  const { t } = useTranslation('shared', {
    keyPrefix: 'features.hltb.settings',
  });

  return (
    <fieldset>
      <Typography as="legend" className="mb-2" variant="h6">
        {t('title')}
      </Typography>

      <Typography className="flex items-center gap-2" variant="label">
        <Checkbox
          checked={settings.isEnabled}
          onChange={(isEnabled) => onChange({ isEnabled })}
        />
        {t('enable')}
      </Typography>

      <Typography
        as="label"
        className={cn('mt-3 mb-1 block', {
          'opacity-40': !settings.isEnabled,
        })}
        htmlFor={DEFAULT_CATEGORY_SELECT_ID}
        variant="label"
      >
        {t('defaultCategory')}
      </Typography>

      <select
        className={cn(
          'select select-sm w-full shadow-none',
          'rounded-[4px] border border-[var(--back-field-border,#3b414e)]',
          'bg-[var(--back-field-background,#272c37)] text-[#fff]',
          'disabled:opacity-40',
        )}
        disabled={!settings.isEnabled}
        id={DEFAULT_CATEGORY_SELECT_ID}
        value={settings.defaultCategory}
        onChange={(event) =>
          onChange({ defaultCategory: event.target.value as HltbCategory })
        }
      >
        {HLTB_CATEGORIES.map((category) => (
          <option key={category} value={category}>
            {t(`category.${category}`)}
          </option>
        ))}
      </select>
    </fieldset>
  );
};

export default HltbSettings;
