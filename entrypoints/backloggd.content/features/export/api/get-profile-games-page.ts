import { queryOptions, UseQueryOptions } from '@tanstack/react-query';

import { api } from '@content/lib/axios';
import { ProfileGamesPageResponseScrape } from '@content/types/api';

import { queryKeys } from './keys';

/**
 * Fetches a user's profile games page and returns the parsed HTML document.
 */
const fetchProfileGamesPage = async (
  username: string,
  pageNumber: number,
): Promise<Document> => {
  try {
    const result = await api.get<string>(`/u/${username}/games`, {
      params: { page: pageNumber },
    });

    const parser = new DOMParser();
    return parser.parseFromString(result, 'text/html');
  } catch (error) {
    console.error(`Failed to fetch page ${pageNumber} for user ${username}`);
    throw error;
  }
};

const getTotalGamesCount = (doc: Document): number => {
  const totalGamesByStatusElement = [
    ...doc.querySelectorAll('.subtitle-text'),
  ].find((el) => el.textContent?.includes('Games'));

  if (!totalGamesByStatusElement) {
    return 0;
  }

  const match = totalGamesByStatusElement.textContent.match(/(\d+)\s+Games/);
  return match ? parseInt(match[1], 10) : 0;
};

const parseProfileGamesPage = (
  doc: Document,
): ProfileGamesPageResponseScrape => {
  const gameCards = [
    ...doc.querySelectorAll('#user-games-library-container .card.game-cover'),
  ];

  const scrapedGames = gameCards.map((card) => {
    const id = card.getAttribute('game_id')!; // Attribute game_id should always exist.
    const name =
      card.querySelector('.game-text-centered')?.textContent?.trim() || '';
    const rating = card.getAttribute('data-rating') || undefined;

    return { id, name, rating };
  });
  const totalGames = getTotalGamesCount(doc);

  return {
    games: scrapedGames,
    totalGames,
  };
};

type ProfileGamesPageParams = {
  pageNumber: number;
  username: string;
};

export const createProfileGamesPageQueryOptions = <
  TError = Error,
  TData = ProfileGamesPageResponseScrape,
>(
  { pageNumber, username }: ProfileGamesPageParams,
  options?: Omit<
    UseQueryOptions<Document, TError, TData>,
    'queryFn' | 'queryKey' | 'select'
  >,
) =>
  queryOptions({
    ...options,
    queryKey: queryKeys.profileGamesPage(username, pageNumber),
    queryFn: () => fetchProfileGamesPage(username, pageNumber),
    select: (data) => parseProfileGamesPage(data),
  });
