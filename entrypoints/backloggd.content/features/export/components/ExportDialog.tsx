import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import Dialog from '@content/shared/components/Dialog/Dialog';
import StatusFilters from '@globalShared/components/StatusFilters';
import Typography from '@globalShared/components/Typography';
import { useStatusFilters } from '@globalShared/hooks/useStatusFilters';

import useExport from '../hooks/useExport';
import { downloadGameDetailsCSV, parseToGameDetailsCSV } from '../utils/csv';
import { downloadGameDetailsJSON, parseToGameDetailsJSON } from '../utils/json';
import ExportProgressIndicator from './ExportProgressIndicator';

type ExportDialogProps = {
  username: string;
  onClose: () => void;
};

const ExportDialog = ({ onClose, username }: ExportDialogProps) => {
  const { t } = useTranslation(undefined, {
    keyPrefix: 'features.export.dialog',
  });

  const isExportTriggered = useRef(false);

  const {
    filters: selectedStatuses,
    toggleStatusFilter,
    hasLoadedStatuses,
  } = useStatusFilters({
    canEditStorage: false,
  });
  const { fetchData, gameDetails, progress, isComplete, isError } = useExport({
    username, // NOTE: username truthiness is checked inside useExport
  });

  const isDialogDisabled =
    progress.phase === 'analyzing' || progress.phase === 'exporting';

  useEffect(() => {
    if (!isExportTriggered.current || (!isComplete && !isError)) return;

    isExportTriggered.current = false;

    // The game list could not be fetched, so there is nothing to export.
    if (isError || gameDetails.length === 0) {
      toast.error(t('features.export.toast.noGamesFound', { keyPrefix: '' }));
      onClose();
      return;
    }

    const gamesDetailsCSV = gameDetails
      .map(parseToGameDetailsCSV)
      .filter((game) => !!game);
    downloadGameDetailsCSV(gamesDetailsCSV); // TODO: Handle promise with await?

    // Delay second download (~150ms) to register both downloads correctly and prevent them from being swallowed by the browser.
    setTimeout(() => {
      const gamesDetailsJSON = gameDetails.map(parseToGameDetailsJSON);
      downloadGameDetailsJSON(gamesDetailsJSON);
    }, 150);

    toast(t('features.export.toast.dataExported', { keyPrefix: '' }));
    onClose();
  }, [isComplete, isError, gameDetails, t, onClose]);

  const handleExport = () => {
    isExportTriggered.current = true;
    fetchData(selectedStatuses);
  };

  if (!hasLoadedStatuses) return;

  return (
    <Dialog
      isDisabled={isDialogDisabled}
      isOpen={true} // NOTE: Dialog visibility is managed by the parent so it can be unmounted to reset internal state.
      submitText={t('submit')}
      title={t('title')}
      onClose={onClose}
      onConfirm={handleExport}
    >
      <Typography className="mb-4" variant="body2">
        {t('description')}
      </Typography>
      <StatusFilters
        direction="row"
        filters={selectedStatuses}
        isDisabled={isDialogDisabled}
        onChange={toggleStatusFilter}
      />
      {isDialogDisabled && <ExportProgressIndicator progress={progress} />}
    </Dialog>
  );
};

export default ExportDialog;
