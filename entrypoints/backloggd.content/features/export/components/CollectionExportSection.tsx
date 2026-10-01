import { useTranslation } from 'react-i18next';

import Button from '@globalShared/components/Button';
import Typography from '@globalShared/components/Typography';

import ExportDialog from './ExportDialog';

type CollectionExportSectionProps = {
  username: string;
};

/** Adds the export action to Backloggd's data settings page. */
const CollectionExportSection = ({
  username,
}: CollectionExportSectionProps) => {
  const { t } = useTranslation(undefined, {
    keyPrefix: 'features.export.settingsAction',
  });

  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCloseDialog = () => setIsModalOpen(false);

  return (
    <>
      <article className="-mx-[15px] mb-4 grid grid-cols-12">
        <div className="col-span-12 px-[15px] md:col-span-8 lg:col-span-9">
          <Typography variant="h4">{t('title')}</Typography>
          <Typography variant="subtitle">{t('description')}</Typography>
        </div>
        <div className="col-span-full my-auto px-[15px] md:col-span-4 lg:col-span-3">
          <Button
            className="w-full duration-0"
            onClick={() => setIsModalOpen(true)}
          >
            {t('button')}
          </Button>
        </div>
      </article>
      {isModalOpen && (
        <ExportDialog username={username} onClose={handleCloseDialog} />
      )}
    </>
  );
};

export default CollectionExportSection;
