import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import Dialog from '@content/shared/components/Dialog/Dialog';
import Icon from '@globalShared/components/Icon';
import Typography from '@globalShared/components/Typography';
import { useExportStatusFilters } from '@globalShared/hooks/useExportStatusFilters';
import { cn } from '@globalShared/utils/cn';

import useExport from '../hooks/useExport';
import { downloadGameDetailsCSV, parseToGameDetailsCSV } from '../utils/csv';
import { getFilename } from '../utils/filename';
import { downloadGameDetailsJSON, parseToGameDetailsJSON } from '../utils/json';
import ExportProgressIndicator from './ExportProgressIndicator';
import StatusFilters from './StatusFilters';
import Tag from './Tag';

type ExportDialogProps = {
  username: string;
  onClose: () => void;
};

/** Collects per-export statuses and starts the game collection export. */
const ExportDialog = ({ onClose, username }: ExportDialogProps) => {
  const { t } = useTranslation(undefined, {
    keyPrefix: 'features.export.dialog',
  });

  const isExportTriggered = useRef(false);

  const {
    filters: selectedStatuses,
    toggleStatusFilter,
    hasLoadedStatuses,
  } = useExportStatusFilters();
  const { fetchData, gameDetails, progress, isComplete, isError } = useExport({
    username, // NOTE: username truthiness is checked inside useExport
  });

  const isDialogDisabled =
    progress.phase === 'analyzing' || progress.phase === 'exporting';
  const hasSelectedStatus = Object.values(selectedStatuses).some(Boolean);

  useEffect(() => {
    if (!isExportTriggered.current || (!isComplete && !isError)) return;

    isExportTriggered.current = false;

    // The game list could not be fetched, so there is nothing to export.
    if (isError || gameDetails.length === 0) {
      toast.error(t('features.export.toast.noGamesFound', { keyPrefix: '' }));
      onClose();
      return;
    }

    const exportFiles = async () => {
      const csvFilename = getFilename('csv', username);
      const jsonFilename = getFilename('json', username);

      try {
        const gamesDetailsCSV = gameDetails
          .map(parseToGameDetailsCSV)
          .filter((game) => !!game);
        await downloadGameDetailsCSV(gamesDetailsCSV, csvFilename);

        // Delay second download (~150ms) to register both downloads correctly and prevent them from being swallowed by the browser.
        await new Promise((resolve) => setTimeout(resolve, 150));

        const gamesDetailsJSON = gameDetails.map(parseToGameDetailsJSON);
        downloadGameDetailsJSON(gamesDetailsJSON, jsonFilename);

        toast(t('features.export.toast.dataExported', { keyPrefix: '' }));
      } catch {
        toast.error(t('features.export.toast.exportFailed', { keyPrefix: '' }));
      } finally {
        onClose();
      }
    };

    void exportFiles();
  }, [isComplete, isError, gameDetails, t, onClose, username]);

  const handleExport = () => {
    if (!hasSelectedStatus) return;
    isExportTriggered.current = true;
    fetchData(selectedStatuses);
  };

  if (!hasLoadedStatuses) return;

  return (
    <Dialog
      closeText={t('cancel')}
      isDisabled={isDialogDisabled}
      isOpen={true} // NOTE: Dialog visibility is managed by the parent so it can be unmounted to reset internal state.
      isSubmitDisabled={!hasSelectedStatus}
      submitText={t('submit')}
      title={t('title')}
      onClose={onClose}
      onConfirm={handleExport}
    >
      <Typography className="text-content/70 mb-4" variant="body2">
        {t('description')}
      </Typography>
      <div
        className={cn(
          'mb-5 flex flex-wrap items-center gap-3 rounded-md px-3 py-3',
          'border-border bg-field border',
        )}
      >
        <span className="text-content">
          <Icon name="download" size={20} />
        </span>
        <span className="min-w-0 flex-1 text-sm font-medium">
          {t('filesDescription')}
        </span>
        <Tag>CSV</Tag>
        <Tag>JSON</Tag>
      </div>
      <StatusFilters
        filters={selectedStatuses}
        isDisabled={isDialogDisabled}
        onChange={toggleStatusFilter}
      />
      <Typography className="mt-3" variant="bodyCompact">
        {t('selectionNote')}
      </Typography>
      {isDialogDisabled && <ExportProgressIndicator progress={progress} />}
    </Dialog>
  );
};

export default ExportDialog;
