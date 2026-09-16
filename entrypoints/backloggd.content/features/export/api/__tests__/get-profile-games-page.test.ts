import { parseProfileGamesPage } from '../get-profile-games-page';

const createGameCard = (index: number, hasTitle: boolean = true) => `
  <div class="card game-cover" game_id="${index}" data-rating="${index % 10}">
    <a class="cover-link" href="/games/game-${index}/"></a>
    <img class="card-img" alt="Game ${index}" />
    ${hasTitle ? `<div class="game-text-centered"> Game ${index} </div>` : ''}
  </div>
`;

const createGames = (count: number) =>
  Array.from({ length: count }, (_, index) => createGameCard(index + 1)).join(
    '',
  );

const parseHtml = (html: string) =>
  new DOMParser().parseFromString(html, 'text/html');

describe('parseProfileGamesPage', () => {
  it('parses the initial infinite-scroll batch and ignores Turbo placeholders', () => {
    const document = parseHtml(`
      <p class="subtitle-text">Showing 94 games</p>
      <div id="user-games-container">
        <div id="user_games">${createGames(70)}</div>
        <turbo-frame id="games_pagination" src="?format=turbo_stream&page=2">
          <div class="card game-cover empty-card shimmer-bg"></div>
          <div class="card game-cover empty-card shimmer-bg"></div>
        </turbo-frame>
      </div>
    `);

    const result = parseProfileGamesPage(document);

    expect(result.games).toHaveLength(70);
    expect(result.games[0]).toEqual({
      id: '1',
      name: 'Game 1',
      rating: '1',
      url: 'https://backloggd.com/games/game-1/',
    });
    expect(result.games[result.games.length - 1]?.id).toBe('70');
    expect(result.totalGames).toBe(94);
  });

  it('parses paginated markup and the lowercase total-games label', () => {
    const document = parseHtml(`
      <p class="subtitle-text">Showing 94 games</p>
      <div id="user-games-container">
        <div id="user_games">${createGames(40)}</div>
        <nav class="pagy nav" aria-label="Pages">
          <a aria-current="page">1</a>
          <a href="?page=2">2</a>
          <a href="?page=3">3</a>
        </nav>
      </div>
    `);

    const result = parseProfileGamesPage(document);

    expect(result.games).toHaveLength(40);
    expect(result.totalGames).toBe(94);
  });

  it('supports legacy markup, comma-separated totals, and image-alt names', () => {
    const document = parseHtml(`
      <p class="subtitle-text">1,234 Games</p>
      <div id="user-games-library-container">
        ${createGameCard(42, false)}
      </div>
    `);

    expect(parseProfileGamesPage(document)).toEqual({
      totalGames: 1234,
      games: [
        {
          id: '42',
          name: 'Game 42',
          rating: '2',
          url: 'https://backloggd.com/games/game-42/',
        },
      ],
    });
  });
});
