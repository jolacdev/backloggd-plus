import { useTranslation } from 'react-i18next';

import Dialog from '@content/shared/components/Dialog/Dialog';
import StatusFilters from '@globalShared/components/StatusFilters';
import Typography from '@globalShared/components/Typography';
import { useStatusFilters } from '@globalShared/hooks/useStatusFilters';

import useExport from '../hooks/useExport';
import { downloadGameDetailsCSV, parseToGameDetailsCSV } from '../utils/csv';
import { downloadGameDetailsJSON, parseToGameDetailsJSON } from '../utils/json';

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
  const { fetchData, gameDetails, isExportEnabled, isFetching, isSuccess } =
    useExport({
      username, // NOTE: username truthiness is checked inside useExport
    });

  const isDialogDisabled = isExportEnabled && isFetching;

  useEffect(() => {
    if (isExportTriggered.current && !isFetching && isSuccess) {
      isExportTriggered.current = false;

      if (gameDetails.length > 0) {
        const gamesDetailsCSV = gameDetails
          .map(parseToGameDetailsCSV)
          .filter((game) => !!game);
        downloadGameDetailsCSV(gamesDetailsCSV); // TODO: Handle promise with await?

        // Delay second download (~150ms) to register both downloads correctly and prevent them from being swallowed by the browser.
        setTimeout(() => {
          const gamesDetailsJSON = gameDetails.map(parseToGameDetailsJSON);
          downloadGameDetailsJSON(gamesDetailsJSON);
        }, 150);
      } else {
        // TODO: Add alert of no game found to export?
        console.warn('No game details found to export.');
      }

      onClose();
    }
  }, [gameDetails, onClose, isFetching, isSuccess]);

  const handleExport = () => {
    isExportTriggered.current = true;
    fetchData(selectedStatuses);
    // TODO: Should await for fetchData logic to hide modal + show alert.
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
        onChange={toggleStatusFilter}
      />
    </Dialog>
  );
};

export default ExportDialog;
