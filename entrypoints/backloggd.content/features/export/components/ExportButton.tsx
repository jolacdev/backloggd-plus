import { useTranslation } from 'react-i18next';

import Dialog from '@content/shared/components/Dialog/Dialog';
import DropdownButton from '@content/shared/components/DropdownButton';

import useExport from '../hooks/useExport';
import { downloadGameDetailsCSV, parseToGameDetailsCSV } from '../utils/csv';
import { downloadGameDetailsJSON, parseToGameDetailsJSON } from '../utils/json';

type ExportButtonProps = {
  username: string;
};

const ExportButton = ({ username }: ExportButtonProps) => {
  const { t } = useTranslation(undefined, { keyPrefix: 'features.export' });

  const [isModalOpen, setIsModalOpen] = useState(false);
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
      setIsModalOpen(false);

      if (gameDetails.length > 0) {
        const gamesDetailsCSV = gameDetails
          .map(parseToGameDetailsCSV)
          .filter((game) => !!game);
        downloadGameDetailsCSV(gamesDetailsCSV); // TODO: Handle promise with await?

        // Delay (~150ms) JSON download to ensure both downloads are registered by the browser.
        // Consecutive synchronous anchor.click() calls can be swallowed in some browsers.
        setTimeout(() => {
          const gamesDetailsJSON = gameDetails.map(parseToGameDetailsJSON);
          downloadGameDetailsJSON(gamesDetailsJSON);
        }, 150);
      } else {
        // TODO: Add alert of no game found to export?
      }
    }
  }, [gameDetails, isExportTriggered, isFetching, isSuccess]);

  const handleExport = () => {
    setIsExportTriggered(true);
    fetchData();
    // TODO: Should await for fetchData logic to hide modal + show alert.
  };

  // TODO: Manage disabled state
  // TODO: CHECK - Dialog close animation when ExportButtons unmounts. Check if refactor to global Dialog.
  return (
    <>
      <DropdownButton
        id="export-button"
        label={t('button')}
        onClick={() => setIsModalOpen(true)}
      />
      <Dialog
        isDisabled={isDialogDisabled}
        isOpen={isModalOpen}
        submitText={t('dialog.submit')}
        title={t('dialog.title')}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleExport}
      >
        <p>{t('dialog.description')}</p>
      </Dialog>
    </>
  );
};

export default ExportButton;
