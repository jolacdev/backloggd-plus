import {
  ensurePositionedMountPoint,
  getBadgeMountPoint,
  getGameCardMeta,
  parseGamePageReleaseYear,
} from '../cards';

/** The real Backloggd library-card partial, which is identical across every route variant. */
const cardHtml = (igdbId: string, title: string) => `
  <div class="card mx-auto game-cover quick-access" game_id="${igdbId}">
    <a href="/games/${title.toLowerCase().replace(/ /g, '-')}/" class="cover-link"></a>
    <div class="overflow-wrapper">
      <img class="lazy card-img height" alt="${title}">
      <div class="overlay"></div>
    </div>
    <div class="game-text-centered">${title}</div>
  </div>
`;

const firstCard = (html: string) => {
  document.body.innerHTML = html;
  return document.querySelector('.card.game-cover')!;
};

describe('getGameCardMeta', () => {
  it('reads the IGDB id, title and slug from a library card', () => {
    expect(
      getGameCardMeta(firstCard(cardHtml('14593', 'Hollow Knight'))),
    ).toEqual({
      igdbId: '14593',
      slug: 'hollow-knight',
      title: 'Hollow Knight',
    });
  });

  it.each([
    [
      'the cover has no alt text',
      '<div class="card game-cover" game_id="14593"><div class="game-text-centered">Hollow Knight</div></div>',
      { igdbId: '14593', slug: '', title: 'Hollow Knight' },
    ],
    ['there is no usable id', '<div class="card game-cover"></div>', null],
    [
      'there is no usable title',
      '<div class="card game-cover" game_id="14593"></div>',
      null,
    ],
  ])('degrades when %s', (_unused, html, expected) => {
    expect(getGameCardMeta(firstCard(html))).toEqual(expected);
  });
});

it('mounts the badge inside the cover wrapper, falling back to the card', () => {
  const card = firstCard(cardHtml('14593', 'Hollow Knight'));
  expect(getBadgeMountPoint(card)).toBe(
    card.querySelector('.overflow-wrapper'),
  );

  const bare = firstCard('<div class="card game-cover" game_id="1"></div>');
  expect(getBadgeMountPoint(bare)).toBe(bare);
});

it("gives the mount point a positioning context, leaving Backloggd's own alone", () => {
  const mountPoint = firstCard(
    '<div class="card game-cover" game_id="1"></div>',
  );
  ensurePositionedMountPoint(mountPoint);
  expect((mountPoint as HTMLElement).style.position).toBe('relative');

  const positioned = firstCard(
    '<div class="card game-cover" game_id="1" style="position: absolute"></div>',
  );
  ensurePositionedMountPoint(positioned);
  expect((positioned as HTMLElement).style.position).toBe('absolute');
});

it('reads the release year from a game page, or nothing at all', () => {
  const parse = (html: string) =>
    parseGamePageReleaseYear(
      new DOMParser().parseFromString(html, 'text/html'),
    );

  expect(parse('<a class="game-year" href="/games/year/2017">2017</a>')).toBe(
    2017,
  );
  expect(parse('<div>no year here</div>')).toBeUndefined();
});
