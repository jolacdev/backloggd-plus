/**
 * Helpers that read Backloggd's markup. Everything here breaks when the site
 * changes its DOM, so it is kept apart from logic that does not.
 */

/**
 * Reads the "N Games" counter Backloggd renders in the header of any paginated
 * game listing (profile library pages and list pages share this markup).
 *
 * @param doc - The parsed page document.
 * @returns The total game count, or 0 when the counter is missing or unparseable.
 */
export const getTotalGamesCount = (doc: Document): number => {
  const totalGamesElement = [...doc.querySelectorAll('.subtitle-text')].find(
    (element) => element.textContent?.includes('Games'),
  );

  if (!totalGamesElement?.textContent) return 0;

  const match = totalGamesElement.textContent.match(/(\d+)\s+Games/);
  return match ? parseInt(match[1], 10) : 0;
};
