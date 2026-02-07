import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import useStorage from '@content/hooks/useStorage';
import { getLoggedInUsername } from '@content/utils/user';
import { testExportLabelStorageItem } from '@globalShared/storage';

import useExport from '../hooks/useExport';

export const TestExportButton = () => {
  const { t } = useTranslation(undefined, { keyPrefix: 'features.export' });
  const [label] = useStorage(testExportLabelStorageItem); // TODO: Temporary. Only for testing purposes.
  const [isExportTriggered, setIsExportTriggered] = useState(false);

  // TODO: Remove
  useEffect(() => {
    console.log({ testExportLabel: label });
  }, [label]);

  const username = getLoggedInUsername();

  const { fetchData, profileGames, isExportEnabled, isFetching } = useExport({
    username: username ?? '', // NOTE: username truthiness is checked inside useExport
  });

  const isButtonDisabled = isExportEnabled && isFetching;

  useEffect(() => {
    if (isExportTriggered && !isFetching && profileGames.length > 0) {
      // TODO: Implement actual logic.
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

  return (
    <button
      className="btn friend-btn"
      disabled={isButtonDisabled}
      id="testButton"
      style={{ height: '33px' }}
      type="button"
      onClick={handleClick}
    >
      {/* TODO: Remove hardcoded loading */}
      {isButtonDisabled ? 'Loading...' : t('buttonText')}
    </button>
  );
};
