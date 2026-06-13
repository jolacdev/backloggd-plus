import Papa from 'papaparse';

/**
 * Converts an array of objects into a CSV string.
 * @param data - Array of objects to be converted to CSV format
 * @param options - UnparseConfig options. Defaults to including headers (header: true).
 * @returns A Promise that resolves to a CSV-formatted string
 */
export const toCSVString = <T extends Record<string, unknown>>(
  data: T[],
  options?: Papa.UnparseConfig,
): Promise<string> =>
  new Promise((resolve) => {
    const csv = Papa.unparse(data, { header: true, ...options });
    resolve(csv);
  });
