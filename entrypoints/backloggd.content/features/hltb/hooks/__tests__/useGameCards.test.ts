import { renderHook, waitFor } from '@testing-library/react';

import useGameCards from '../useGameCards';

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

const renderLibrary = (html: string) => {
  document.body.innerHTML = `<div id="user-games-library-container">${html}</div>`;
  return document.getElementById('user-games-library-container')!;
};

describe('useGameCards', () => {
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
});
