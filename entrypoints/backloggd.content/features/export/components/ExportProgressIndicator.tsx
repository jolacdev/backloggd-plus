import { useTranslation } from 'react-i18next';

import Typography from '@globalShared/components/Typography';

import { ExportProgress } from '../types';

type ExportProgressIndicatorProps = {
  progress: ExportProgress;
};

const ExportProgressIndicator = ({
  progress: { current, phase, total },
}: ExportProgressIndicatorProps) => {
  const { t } = useTranslation(undefined, {
    keyPrefix: 'features.export.dialog.progress',
  });

  const isAnalyzing = phase === 'analyzing';

  return (
    <div className="mt-4 flex items-center gap-4">
      <span className="loading loading-spinner loading-sm" />
      <Typography variant="subtitle">
        {isAnalyzing
          ? t('analyzingLibrary')
          : t('exportingGames', { current, total })}
      </Typography>
    </div>
  );
};

export default ExportProgressIndicator;
