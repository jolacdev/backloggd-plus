import { useTranslation } from 'react-i18next';

import Checkbox from '@globalShared/components/Checkbox';
import Typography from '@globalShared/components/Typography';
import {
  StatusFiltersState,
  StatusKey,
} from '@globalShared/hooks/useStatusFilters';
import { cn } from '@globalShared/utils/cn';

type StatusFiltersProps = {
  filters: StatusFiltersState;
  direction?: 'column' | 'row';
  onChange: (key: StatusKey) => void;
};

const StatusFilters = ({
  direction = 'column',
  filters,
  onChange,
}: StatusFiltersProps) => {
  const { t } = useTranslation('shared', {
    keyPrefix: 'features.export.filters',
  });

  return (
    <fieldset>
      <Typography as="legend" className="mb-2" variant="h6">
        {t('title')}
      </Typography>
      <div
        className={cn('flex gap-4', {
          'flex-col gap-2': direction === 'column',
        })}
      >
        {(Object.entries(filters) as [StatusKey, boolean][]).map(
          ([key, checked]) => (
            <Typography
              key={key}
              className="flex items-center gap-2"
              variant="label"
            >
              <Checkbox checked={checked} onChange={() => onChange(key)} />
              {t(`status.${key}`)}
            </Typography>
          ),
        )}
      </div>
    </fieldset>
  );
};

export default StatusFilters;
