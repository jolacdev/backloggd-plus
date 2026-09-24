import { useTranslation } from 'react-i18next';

import Typography from '@globalShared/components/Typography';
import {
  StatusFiltersState,
  StatusKey,
} from '@globalShared/hooks/useExportStatusFilters';

import CheckboxCard from './CheckboxCard';

type StatusFiltersProps = {
  filters: StatusFiltersState;
  isDisabled?: boolean;
  onChange: (key: StatusKey) => void;
};

/** Renders temporary per-export status choices as selectable cards. */
const StatusFilters = ({
  filters,
  onChange,
  isDisabled = false,
}: StatusFiltersProps) => {
  const { t } = useTranslation('shared', {
    keyPrefix: 'features.export.filters',
  });

  return (
    <fieldset className="group min-w-0" disabled={isDisabled}>
      <legend className="mb-1 text-base font-semibold">{t('title')}</legend>
      <Typography className="mb-3" variant="bodyCompact">
        {t('description')}
      </Typography>
      <div className="grid grid-cols-1 gap-2 min-[480px]:grid-cols-2">
        {(Object.entries(filters) as [StatusKey, boolean][]).map(
          ([key, checked]) => (
            <CheckboxCard
              key={key}
              checked={checked}
              onChange={() => onChange(key)}
            >
              {t(`status.${key}`)}
            </CheckboxCard>
          ),
        )}
      </div>
    </fieldset>
  );
};

export default StatusFilters;
