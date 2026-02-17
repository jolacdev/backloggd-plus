import { useTranslation } from 'react-i18next';

import Dialog from '@content/shared/components/Dialog/Dialog';
import DropdownButton from '@content/shared/components/DropdownButton';

import useExport from '../hooks/useExport';

type ExportButtonProps = {
  username: string;
};

const ExportButton = ({ username }: ExportButtonProps) => {
  const { t } = useTranslation(undefined, { keyPrefix: 'features.export' });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExportTriggered, setIsExportTriggered] = useState(false);

  const { fetchData, profileGames, isExportEnabled, isFetching } = useExport({
    username, // NOTE: username truthiness is checked inside useExport
  });

  // const isButtonDisabled = isExportEnabled && isFetching;

  // TODO: Implement actual logic
  useEffect(() => {
    if (isExportTriggered && !isFetching && profileGames.length > 0) {
      // eslint-disable-next-line no-console
      console.log('Exporting data:', { profileGames });

      // Reset the trigger after export
      setIsExportTriggered(false);
    }
  }, [isExportTriggered, isFetching, profileGames]);

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
        // isLoading={is???Disabled} // TODO: implement
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
