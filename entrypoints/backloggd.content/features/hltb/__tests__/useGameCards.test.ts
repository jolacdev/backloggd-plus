import { renderHook, waitFor } from '@testing-library/react';

import useGameCards, { getGameCardMeta } from '../useGameCards';

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

const renderLibrary = (html: string) => {
  document.body.innerHTML = `<div id="user-games-library-container">${html}</div>`;
  return document.getElementById('user-games-library-container')!;
};

describe('useGameCards', () => {
  it('ignores lazy-frame shimmers and inert templates, then tracks the appended batch', async () => {
    const container = renderLibrary(
      `<div id="user_games">${cardHtml('14593', 'Hollow Knight')}</div><turbo-frame loading="lazy" id="games_pagination" src="?format=turbo_stream&page=2"><div class="card game-cover empty-card shimmer-bg"></div></turbo-frame><template>${cardHtml('194998', 'Pokémon Scarlet')}</template>`,
    );
    const { result } = renderHook(() => useGameCards(true));
    expect(result.current.map(({ meta }) => meta.title)).toEqual([
      'Hollow Knight',
    ]);
    container
      .querySelector('#user_games')!
      .insertAdjacentHTML('beforeend', cardHtml('194998', 'Pokémon Scarlet'));
    container.querySelector('#games_pagination')!.remove();
    await waitFor(() =>
      expect(result.current.map(({ meta }) => meta.title)).toEqual([
        'Hollow Knight',
        'Pokémon Scarlet',
      ]),
    );
  });

  it('drops a card morphed back into an unidentified placeholder', async () => {
    renderLibrary(cardHtml('14593', 'Hollow Knight'));
    const { result } = renderHook(() => useGameCards(true));
    document.querySelector('.game-cover')!.removeAttribute('game_id');
    await waitFor(() => expect(result.current).toEqual([]));
  });

  it('tracks cards as Backloggd adds and removes them, with no page reload', async () => {
    const container = renderLibrary(cardHtml('14593', 'Hollow Knight'));
    const { result } = renderHook(() => useGameCards(true));

    expect(result.current).toHaveLength(1);
    expect(result.current[0].meta).toMatchObject({
      igdbId: '14593',
      title: 'Hollow Knight',
    });

    container.insertAdjacentHTML('beforeend', cardHtml('1020', 'GTA V'));
    await waitFor(() => {
      expect(result.current).toHaveLength(2);
    });

    container.querySelector('[game_id="1020"]')!.remove();
    await waitFor(() => {
      expect(result.current).toHaveLength(1);
    });
  });

  /**
   * Backloggd's sort and filter links are Turbo *frame* navigations: they replace the
   * container element itself and push a new URL without firing `turbo:load`. An observer
   * bound to the container would be left watching a detached node, which is why badges
   * appeared on a direct load of a filtered URL but never when navigating to one.
   */
  it('survives the library container being replaced wholesale', async () => {
    renderLibrary(cardHtml('14593', 'Hollow Knight'));
    const { result } = renderHook(() => useGameCards(true));
    expect(result.current).toHaveLength(1);

    const replacement = document.createElement('div');
    replacement.id = 'user-games-library-container';
    replacement.innerHTML =
      cardHtml('1020', 'GTA V') + cardHtml('119133', 'Elden Ring');
    document
      .getElementById('user-games-library-container')!
      .replaceWith(replacement);

    await waitFor(() => {
      expect(result.current.map((card) => card.meta.title)).toEqual([
        'GTA V',
        'Elden Ring',
      ]);
    });
  });

  // Re-rendering every badge on unrelated DOM churn would undo the viewport gating.
  it('keeps the same array when nothing changed, so badges do not remount', async () => {
    const container = renderLibrary(cardHtml('14593', 'Hollow Knight'));
    const { result } = renderHook(() => useGameCards(true));
    const first = result.current;

    container.insertAdjacentHTML('beforeend', '<div class="unrelated"></div>');

    await waitFor(() => {
      expect(document.querySelector('.unrelated')).not.toBeNull();
    });
    expect(result.current).toBe(first);
  });

  // Off the library — or with the feature disabled — nothing is observed at all.
  it('registers nothing while disabled', () => {
    renderLibrary(cardHtml('14593', 'Hollow Knight'));

    expect(renderHook(() => useGameCards(false)).result.current).toEqual([]);
  });

  it('recognizes card metadata changed by a Turbo morph', async () => {
    renderLibrary(cardHtml('14593', 'Hollow Knight'));
    const { result } = renderHook(() => useGameCards(true));
    const oldKey = result.current[0].key;
    const card = document.querySelector('.game-cover')!;
    card.setAttribute('game_id', '119133');
    card.querySelector('img')!.setAttribute('alt', 'Elden Ring');
    card.querySelector('a')!.setAttribute('href', '/games/elden-ring/');
    await waitFor(() =>
      expect(result.current[0].meta).toEqual({
        igdbId: '119133',
        slug: 'elden-ring',
        title: 'Elden Ring',
      }),
    );
    expect(result.current[0].key).not.toBe(oldKey);
  });

  it('recognizes a cover wrapper replaced for the same game', async () => {
    renderLibrary(cardHtml('14593', 'Hollow Knight'));
    const { result } = renderHook(() => useGameCards(true));
    const oldMount = result.current[0].mountPoint;
    oldMount.replaceWith(oldMount.cloneNode(true));
    await waitFor(() =>
      expect(result.current[0].mountPoint).not.toBe(oldMount),
    );
  });
});
