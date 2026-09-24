import { useTranslation } from 'react-i18next';

import Typography from '@globalShared/components/Typography';
import {
  StatusFiltersState,
  StatusKey,
} from '@globalShared/hooks/useExportStatusFilters';
import Tooltip from '@popup/components/Tooltip';

import CheckboxCard from './CheckboxCard';

type StatusPreferencesProps = {
  filters: StatusFiltersState;
  isDisabled: boolean;
  onChange: (key: StatusKey) => void;
};

/** Renders the popup's persistent default status choices. */
const StatusPreferences = ({
  filters,
  onChange,
  isDisabled,
}: StatusPreferencesProps) => {
  const { t } = useTranslation('popup', {
    keyPrefix: 'gameCollection.preferences',
  });
  const { t: tShared } = useTranslation('shared', {
    keyPrefix: 'features.export.filters.status',
  });

  return (
    <fieldset className="group min-w-0" disabled={isDisabled}>
      <Typography
        as="legend"
        className="mb-2 flex w-full items-center justify-between gap-2"
        variant="labelSmall"
      >
        <span>{t('title')}</span>
        <Tooltip text={t('tooltip')} />
      </Typography>
      <Typography className="text-content/75" variant="caption">
        {t('description')}
      </Typography>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {(Object.entries(filters) as [StatusKey, boolean][]).map(
          ([key, isChecked]) => (
            <CheckboxCard
              key={key}
              checked={isChecked}
              onChange={() => onChange(key)}
            >
              {tShared(key)}
            </CheckboxCard>
          ),
        )}
      </div>
    </fieldset>
  );
};

export default StatusPreferences;
