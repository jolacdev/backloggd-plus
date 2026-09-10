// Strip characters that are invalid in filenames
const sanitizeFilenamePart = (part: string): string =>
  part.replace(/[^a-zA-Z0-9-_]/g, '');

// Local YYYY-MM-DD so the date matches the user's calendar day, not UTC.
const getLocalDate = (): string => {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

/**
 * Builds a descriptive filename from the given parts and the current date.
 *
 * Parts are sanitized and joined with `-`; empty or absent parts are dropped,
 * so an export with no context falls back to an undated-prefix name.
 *
 * @param extension - The file extension.
 * @param parts - Descriptive segments, most general first (e.g. username, list slug).
 * @example
 * getFilename('csv', 'forefo8216') // 'backloggd-forefo8216-2026-09-08.csv'
 * getFilename('csv', 'forefo8216', 'my-list') // 'backloggd-forefo8216-my-list-2026-09-08.csv'
 * getFilename('json') // 'backloggd-2026-09-08.json'
 */
export const getFilename = (
  extension: 'csv' | 'json',
  ...parts: (string | undefined)[]
): string => {
  const safeParts = parts
    .map((part) => (part ? sanitizeFilenamePart(part) : ''))
    .filter(Boolean);

  const filename = ['backloggd', ...safeParts, getLocalDate()].join('-');

  return `${filename}.${extension}`;
};
