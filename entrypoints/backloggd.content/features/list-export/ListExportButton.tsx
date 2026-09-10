import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { getFilename } from '@content/shared/utils/filename';
import { getListSlug } from '@content/shared/utils/url';
import Button from '@globalShared/components/Button';

import { downloadListJSON } from './json';
import useListExport from './useListExport';

const ListExportButton = () => {
  const { t } = useTranslation(undefined, { keyPrefix: 'features.listExport' });

  const isExportTriggered = useRef(false);

  const {
    exportRunId,
    listDetails,
    phase,
    routeParams,
    settledPages,
    startExport,
    totalPages,
  } = useListExport();

  const isExporting = phase === 'analyzing' || phase === 'exporting';

  useEffect(() => {
    const isSettled = phase === 'complete' || phase === 'error';
    if (!isExportTriggered.current || !isSettled) return;

    isExportTriggered.current = false;

    // The list could not be fetched, or it holds no entries to export.
    if (phase === 'error' || !routeParams || !listDetails?.entries.length) {
      toast.error(t('toast.noEntriesFound'));
      return;
    }

    try {
      downloadListJSON(
        listDetails,
        getFilename('json', routeParams.username, getListSlug(routeParams)),
      );
      toast(t('toast.listExported'));
    } catch {
      toast.error(t('toast.exportFailed'));
    }
  }, [exportRunId, listDetails, phase, routeParams, t]);

  const handleExport = () => {
    isExportTriggered.current = true;
    startExport();
  };

  return (
    <div className="mb-3">
      <Button
        className="w-full duration-0"
        disabled={isExporting}
        onClick={handleExport}
      >
        {isExporting ? (
          <span className="flex items-center gap-2">
            <span className="loading loading-spinner loading-xs" />
            {totalPages > 1
              ? t('progress.exporting', {
                  current: settledPages,
                  total: totalPages,
                })
              : t('progress.analyzing')}
          </span>
        ) : (
          t('button')
        )}
      </Button>
    </div>
  );
};

export default ListExportButton;
