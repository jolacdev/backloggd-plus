import { GameDetails } from '../../types';
import { parseToGameDetailsJSON } from '../json';

describe('parseToGameDetailsJSON', () => {
  it('preserves the complete game-detail response, including unknown future fields', () => {
    const gameDetails: GameDetails & {
      related_game_logs: Record<string, unknown>;
    } = {
      id: '42',
      most_recent_playthrough_id: null,
      name: 'Game 42',
      playthroughs: {},
      rating: '8',
      related_game_logs: { example: true },
      url: 'https://backloggd.com/games/game-42/',
    };

    expect(parseToGameDetailsJSON(gameDetails)).toEqual({
      id: '42',
      most_recent_playthrough_id: null,
      name: 'Game 42',
      playthroughs: {},
      related_game_logs: { example: true },
    });
  });
});
