import { useEffect, useState } from 'react';
import type { WxtStorageItem } from 'wxt/utils/storage';

const useStorage = <T, K extends Record<string, unknown>>(
  storageItem: WxtStorageItem<T, K>,
) => {
  const [value, setValue] = useState<T>(storageItem.fallback);

  // Initial effect to get storage value and watch for changes.
  useEffect(() => {
    storageItem.getValue().then((val) => {
      setValue(val);
    });

    const unwatch = storageItem.watch((newValue) => {
      setValue(newValue);
    });

    return () => unwatch();
  }, [storageItem]);

  // Update function to update storage value and local state.
  const updateValue = async (newValue: T) => {
    await storageItem.setValue(newValue);
  };

  return [value, updateValue] as const;
};

export default useStorage;
