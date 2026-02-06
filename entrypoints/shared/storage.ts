// TODO: Remove after testing.
export const testExportLabelStorageItem = storage.defineItem<string>(
  'local:testExportLabel',
  {
    fallback: 'Export',
  },
);

// TODO: Remove after testing.
export const testValueStorageItem =
  storage.defineItem<number>('local:testValue');
