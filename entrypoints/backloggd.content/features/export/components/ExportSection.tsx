import { useTranslation } from 'react-i18next';

import SettingsActionRow from '@content/shared/components/Dialog/SettingsActionRow';

import ExportDialog from './ExportDialog';

type ExportSectionProps = {
  username: string;
};

const ExportSection = ({ username }: ExportSectionProps) => {
  const { t } = useTranslation(undefined, {
    keyPrefix: 'features.export.settingsAction',
  });

  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCloseDialog = () => setIsModalOpen(false);

  return (
    <section id="game-transfer-section">
      <SettingsActionRow
        buttonLabel={t('button')}
        description={t('description')}
        title={t('title')}
        onClick={() => setIsModalOpen(true)}
      />
      {isModalOpen && (
        <ExportDialog username={username} onClose={handleCloseDialog} />
      )}
    </section>
  );
};

export default ExportSection;
