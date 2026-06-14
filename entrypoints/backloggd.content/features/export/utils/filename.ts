// Strip characters that are invalid in filenames
const sanitizeUsername = (username: string): string =>
  username.replace(/[^a-zA-Z0-9-_]/g, '');

// Local YYYY-MM-DD so the date matches the user's calendar day, not UTC.
const getLocalDate = (): string => {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

/**
 * Builds a descriptive filename, which includes the Backloggd username and the current date.
 * Falls back to an undated, user-less name when no username is available.
 * @param extension - The file extension.
 * @param username - The Backloggd username.
 */
export const getFilename = (
  extension: 'csv' | 'json',
  username?: string,
): string => {
  const safeUsername = username ? sanitizeUsername(username) : '';
  const filename = safeUsername
    ? `backloggd-${safeUsername}-${getLocalDate()}`
    : `backloggd-${getLocalDate()}`;

  return `${filename}.${extension}`;
};
