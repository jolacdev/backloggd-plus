import { useTranslation } from 'react-i18next';

import SettingsActionRow from '@content/shared/components/Dialog/SettingsActionRow';

import ExportDialog from './ExportDialog';

type ExportProps = {
  username: string;
};

const ExportSection = ({ username }: ExportProps) => {
  const { t } = useTranslation(undefined, {
    keyPrefix: 'features.export.settingsAction',
  });

  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCloseDialog = () => setIsModalOpen(false);

  return (
    <>
      <SettingsActionRow
        buttonLabel={t('button')}
        description={t('description')}
        title={t('title')}
        onClick={() => setIsModalOpen(true)}
      />
      {isModalOpen && (
        <ExportDialog username={username} onClose={handleCloseDialog} />
      )}
    </>
  );
};

export default ExportSection;
