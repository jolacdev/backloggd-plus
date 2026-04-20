import { useTranslation } from 'react-i18next';

import Dialog from '@content/shared/components/Dialog/Dialog';
import DropdownButton from '@content/shared/components/DropdownButton';

import useExport from '../hooks/useExport';
import { downloadGameLogDetailsCSV } from '../utils/csv';

type ExportButtonProps = {
  username: string;
};

const ExportButton = ({ username }: ExportButtonProps) => {
  const { t } = useTranslation(undefined, { keyPrefix: 'features.export' });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExportTriggered, setIsExportTriggered] = useState(false);

  const {
    fetchData,
    games,
    profileGames,
    isExportEnabled,
    isFetching,
    isSuccess,
  } = useExport({
    exportType: 'csv',
    username, // NOTE: username truthiness is checked inside useExport
  });

  const isDialogDisabled = isExportEnabled && isFetching;

  // TODO: Implement actual logic
  useEffect(() => {
    if (isExportTriggered && !isFetching && isSuccess) {
      console.debug('Exporting data:', { games, profileGames });

      // Reset the trigger after export
      setIsExportTriggered(false);
      setIsModalOpen(false);

      if (games.length > 0) {
        downloadGameLogDetailsCSV(games);
      }
    }
  }, [games, isExportTriggered, isFetching, isSuccess, profileGames]);

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
