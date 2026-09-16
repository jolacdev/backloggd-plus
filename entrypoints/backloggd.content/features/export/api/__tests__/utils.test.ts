import { ProfileGamesPageScrapeResponse } from '@content/shared/types/api';

import {
  deduplicateProfileGames,
  getPageNumbers,
  getTotalPages,
} from '../utils';

const createPage = (
  gamesOnPage: number,
  totalGames: number,
): ProfileGamesPageScrapeResponse => ({
  totalGames,
  games: Array.from({ length: gamesOnPage }, (_, index) => ({
    id: String(index),
    name: `Game ${index}`,
    url: `https://backloggd.com/games/game-${index}/`,
  })),
});

describe('profile game utils', () => {
  describe('pagination', () => {
    it('calculates pages from the 70-game infinite-scroll batch', () => {
      expect(getTotalPages(createPage(70, 94))).toBe(2);
      expect(getPageNumbers(2)).toEqual([1, 2]);
    });

    it('calculates pages from the 40-game paginated batch', () => {
      expect(getTotalPages(createPage(40, 94))).toBe(3);
      expect(getPageNumbers(3)).toEqual([1, 2, 3]);
    });

    it('returns no pages for missing or empty results', () => {
      expect(getTotalPages()).toBe(0);
      expect(getTotalPages(createPage(0, 0))).toBe(0);
      expect(getPageNumbers(0)).toEqual([]);
    });
  });

  describe('deduplicateProfileGames', () => {
    it('keeps the first occurrence of each game ID in its original order', () => {
      const firstGame = createPage(1, 1).games[0];
      const secondGame = {
        id: '2',
        name: 'Game 2',
        url: 'https://backloggd.com/games/game-2/',
      };
      const duplicateFirstGame = {
        ...firstGame,
        name: 'Duplicate Game 0',
      };

      expect(
        deduplicateProfileGames([firstGame, secondGame, duplicateFirstGame]),
      ).toEqual([firstGame, secondGame]);
    });
  });
});
