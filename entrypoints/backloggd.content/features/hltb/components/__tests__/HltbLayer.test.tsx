import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * End-to-end cover of the content-script pipeline: a Backloggd DOM goes in, badges come
 * out. Only the background worker is faked. Storage is faked rather than using
 * `fakeBrowser`, which pulls esbuild into jsdom.
 */

// `vi.mock` is hoisted above the module body, so shared state must be hoisted with it.
const state = vi.hoisted(() => ({
  settings: { defaultCategory: 'main', isEnabled: true },
  shouldCacheLoadFail: false,
}));

vi.mock('@globalShared/storage', () => ({
  hltbEndpointStorageItem: {
    fallback: null,
    getValue: async () => null,
    setValue: async () => {},
    watch: () => () => {},
  },
  hltbResolutionsStorageItem: {
    fallback: {},
    getValue: async () => {
      if (state.shouldCacheLoadFail) throw new Error('storage unavailable');
      return {};
    },
    setValue: async () => {},
    watch: () => () => {},
  },
  hltbSettingsStorageItem: {
    fallback: state.settings,
    getValue: async () => state.settings,
    setValue: async () => {},
    watch: () => () => {},
  },
}));

// Stands in for the background worker, using the shape the live API actually returns.
vi.mock('wxt/browser', () => ({
  browser: {
    runtime: {
      sendMessage: async ({ title }: { title: string }) => ({
        status: 'ok',
        games: [
          {
            hltbId: 26286,
            name: title,
            times: { all: 150549, hundred: 236141, main: 97204, plus: 149763 },
            year: 2017,
          },
        ],
      }),
    },
  },
}));

import HltbLayer from '../HltbLayer';

beforeAll(() => {
  // The real observer never fires in jsdom, and viewport gating is not what this suite
  // covers — `cards.test.ts` owns the registry.
  class ImmediateIntersectionObserver {
    private readonly callback: IntersectionObserverCallback;

    constructor(callback: IntersectionObserverCallback) {
      this.callback = callback;
    }

    observe(element: Element) {
      this.callback(
        [
          {
            target: element,
            isIntersecting: true,
          } as IntersectionObserverEntry,
        ],
        this as unknown as IntersectionObserver,
      );
    }

    disconnect() {}
    unobserve() {}
  }

  vi.stubGlobal('IntersectionObserver', ImmediateIntersectionObserver);
});

beforeEach(() => {
  state.shouldCacheLoadFail = false;
  state.settings.isEnabled = true;
  window.history.pushState({}, '', '/u/forefo8216/games/');
});

const gameCard = (igdbId: string, title: string) => `
  <div class="card mx-auto game-cover" game_id="${igdbId}">
    <a href="/games/${title.toLowerCase().replace(/ /g, '-')}/" class="cover-link"></a>
    <div class="overflow-wrapper"><img class="card-img" alt="${title}"></div>
  </div>`;

const renderLayer = () => {
  document.body.innerHTML = `<div id="user-games-library-container">
      ${gameCard('14593', 'Hollow Knight')}${gameCard('135243', 'It Takes Two')}
    </div><div id="root"></div>`;

  render(
    <QueryClientProvider client={new QueryClient()}>
      <HltbLayer />
    </QueryClientProvider>,
    { container: document.getElementById('root')! },
  );
};

const badges = () => document.querySelectorAll<HTMLElement>('.bgpl-hltb-badge');
const tooltip = () => document.querySelector('.bgpl-hltb-tooltip');

const renderBadges = async () => {
  renderLayer();

  await waitFor(() => {
    expect(badges()).toHaveLength(2);
  });
};

describe('HltbLayer', () => {
  it("portals a badge into every matched card's cover wrapper", async () => {
    await renderBadges();

    expect(badges()[0].parentElement).toHaveClass('overflow-wrapper');
    expect(badges()[0]).toHaveTextContent('27h');
  });

  // The cache is an optimisation, never a prerequisite: one storage error must not blank
  // every badge on the page.
  it('still renders when the resolution cache cannot be read', async () => {
    state.shouldCacheLoadFail = true;

    await renderBadges();
  });

  it.each([
    [
      'the feature is disabled',
      () => {
        state.settings.isEnabled = false;
      },
    ],
    [
      'the route is not a library page',
      () => {
        window.history.pushState({}, '', '/games/hollow-knight/');
      },
    ],
  ])('renders nothing when %s', async (_unused, arrange) => {
    arrange();
    renderLayer();

    await act(async () => {});

    expect(badges()).toHaveLength(0);
  });

  // Screen readers get the whole breakdown without needing the visual tooltip, and the
  // badge sits on top of Backloggd's cover link so it must never navigate for it.
  it('is focusable, fully described, and swallows its own clicks', async () => {
    const user = userEvent.setup();
    await renderBadges();

    expect(badges()[0]).toHaveAttribute('tabindex', '0');
    expect(badges()[0].getAttribute('aria-label')).toBe(
      [
        'Hollow Knight',
        'features.hltb.category.main: 27h',
        'features.hltb.category.plus: 41½h',
        'features.hltb.category.hundred: 65½h',
        'features.hltb.category.all: 42h',
      ].join('. '),
    );

    const onCardClick = vi.fn();
    document
      .querySelectorAll('.game-cover')[0]
      .addEventListener('click', onCardClick);
    await user.click(badges()[0]);

    expect(onCardClick).not.toHaveBeenCalled();
  });

  describe('tooltip', () => {
    const openTooltip = async () => {
      await renderBadges();
      vi.useFakeTimers();
      fireEvent.mouseEnter(badges()[0]);
    };

    const settleDismissal = () => {
      act(() => {
        vi.advanceTimersByTime(5000);
      });
    };

    afterEach(() => {
      vi.useRealTimers();
    });

    /**
     * The badge is a tiny corner target and the tooltip opens below it, so the pointer must
     * leave the badge to reach the tooltip — the card is the hover region instead, and
     * leaving it fires before the tooltip's `mouseenter`. The grace period has to survive
     * exactly that crossing.
     */
    it('opens on hover and survives the crossing from card to tooltip', async () => {
      await openTooltip();
      expect(tooltip()).toBeInTheDocument();

      fireEvent.mouseLeave(document.querySelectorAll('.game-cover')[0]);
      fireEvent.mouseEnter(tooltip()!);
      settleDismissal();

      expect(tooltip()).toBeInTheDocument();
    });

    it('closes once the pointer leaves the card entirely', async () => {
      await openTooltip();
      fireEvent.mouseLeave(document.querySelectorAll('.game-cover')[0]);
      settleDismissal();

      expect(tooltip()).not.toBeInTheDocument();
    });
  });
});
