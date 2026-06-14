import { ProfileGamesPageScrapeResponse } from '@content/shared/types/api';

/**
 * Calculates the total number of pages based on the total number of games and the number of games per page.
 * @param profileGamesPage - The scraped profile games page data.
 * @returns The total number of pages, or 0 if the page data is absent or contains no games.
 */
export const getTotalPages = (
  profileGamesPage?: ProfileGamesPageScrapeResponse,
): number => {
  if (!profileGamesPage) return 0;

  const { games, totalGames } = profileGamesPage;

  if (totalGames === 0 || games.length === 0) return 0;

  return Math.ceil(totalGames / games.length);
};

/**
 * Generates an array of page numbers from 1 up to the specified total number of pages.
 * @param totalPages - The total number of pages.
 * @returns An array containing sequential page numbers (e.g., [1, 2, 3]).
 */
export const getPageNumbers = (totalPages: number): number[] =>
  Array.from({ length: totalPages }, (_, index) => index + 1);
