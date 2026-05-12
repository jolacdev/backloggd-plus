import { useTranslation } from 'react-i18next';

import Dialog from '@content/shared/components/Dialog/Dialog';

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

  const [isExportTriggered, setIsExportTriggered] = useState(false);

  const { fetchData, gameDetails, isExportEnabled, isFetching, isSuccess } =
    useExport({
      username, // NOTE: username truthiness is checked inside useExport
    });

  const isDialogDisabled = isExportEnabled && isFetching;

  // TODO: Implement actual logic
  useEffect(() => {
    if (isExportTriggered && !isFetching && isSuccess) {
      console.debug('Exporting data:', { gameDetails });

      // Reset the trigger after export
      setIsExportTriggered(false);

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
      }

      onClose();
    }
  }, [gameDetails, onClose, isExportTriggered, isFetching, isSuccess]);

  const handleExport = () => {
    setIsExportTriggered(true);
    fetchData();
    // TODO: Should await for fetchData logic to hide modal + show alert.
  };

  return (
    <Dialog
      isDisabled={isDialogDisabled}
      isOpen={true} // NOTE: Dialog visibility is managed by the parent so it can be unmounted to reset internal state.
      submitText={t('submit')}
      title={t('title')}
      onClose={onClose}
      onConfirm={handleExport}
    >
      <p>{t('description')}</p>
    </Dialog>
  );
};

export default ExportDialog;
