import { useTranslation } from 'react-i18next';

import DropdownButton from '@content/components/DropdownButton';

import useExport from '../hooks/useExport';

type ExportButtonProps = {
  username: string;
};

// TODO: Add modal for validation.
const ExportButton = ({ username }: ExportButtonProps) => {
  const { t } = useTranslation(undefined, { keyPrefix: 'features.export' });

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

  const handleClick = () => {
    setIsExportTriggered(true);
    fetchData();
  };

  // TODO: Manage disabled state
  return (
    <DropdownButton
      id="export-button"
      label={t('buttonText')}
      onClick={handleClick}
    />
  );
};

export default ExportButton;
