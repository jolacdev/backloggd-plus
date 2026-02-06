import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { testExportLabelStorageItem } from '@globalShared/storage';

const App = () => {
  const { t } = useTranslation();
  const [value, setValue] = useState('');

  useEffect(() => {
    testExportLabelStorageItem.getValue().then(setValue);
  }, []);

  const handleSave = async () => {
    await testExportLabelStorageItem.setValue(value);
  };

  return (
    <div className="bg-base-300 p-6 text-white">
      <header className="mb-6">
        <h1 className="text-primary text-xl font-bold select-none">
          {t('title')}
        </h1>
      </header>

      <main className="flex flex-col gap-6">
        <input
          className="input input-primary"
          placeholder={t('test.placeholder')}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <button className="btn btn-primary" onClick={handleSave}>
          {t('test.save')}
        </button>
      </main>
    </div>
  );
};

export default App;
