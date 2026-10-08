import { useTranslation } from 'react-i18next';

import { ExportProgress } from '../types';

type ExportProgressIndicatorProps = {
  progress: ExportProgress;
};

/** Reports the active export phase and completed game count. */
const ExportProgressIndicator = ({
  progress: { current, phase, total },
}: ExportProgressIndicatorProps) => {
  const { t } = useTranslation(undefined, {
    keyPrefix: 'features.export.dialog.progress',
  });

  const isAnalyzing = phase === 'analyzing';
  const message = isAnalyzing
    ? t('analyzingCollection')
    : t('exportingGames', { current, total });

  return (
    <div
      className="border-border bg-field mt-5 rounded-md border p-3"
      role="status"
    >
      <div className="text-content flex items-center gap-3 text-sm">
        <span className="loading loading-spinner loading-sm text-primary" />
        {message}
      </div>
      {!isAnalyzing && total > 0 && (
        <progress
          aria-label={message}
          className="progress text-primary mt-3 h-1.5 w-full"
          max={total}
          value={current}
        />
      )}
    </div>
  );
};

export default ExportProgressIndicator;
