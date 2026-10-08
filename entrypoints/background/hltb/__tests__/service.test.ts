// @vitest-environment node
// The queue and the circuit breaker are exercised through the operation they guard, with
// the transport mocked — the client has its own suite.
import { hltbSettingsStorageItem } from '@globalShared/storage';

import {
  clearCache,
  getBlockedUntil,
  readCache,
  resetHltbCache,
  setBlockedUntil,
} from '../cache';
import { resetHltbFailures, resetHltbService, searchGames } from '../service';

const searchHltbMock = vi.hoisted(() => vi.fn());

vi.mock('../client', () => ({ searchHltb: searchHltbMock }));

const MAX_CONCURRENT_REQUESTS = 1;
const FIVE_MINUTES_MS = 5 * 60 * 1000;

const okResult = {
  status: 'ok',
  games: [
    {
      hltbId: 1,
      name: 'Braid',
      times: { all: null, hundred: null, main: 3600, plus: null },
    },
  ],
};

describe('searchGames', () => {
  beforeEach(() => {
    fakeBrowser.reset();
    resetHltbCache();
    resetHltbService();
    searchHltbMock.mockReset();
    searchHltbMock.mockResolvedValue(okResult);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('splits the title the way HowLongToBeat does, and answers a blank one for free', async () => {
    await searchGames('  Hollow   Knight ');
    expect(searchHltbMock).toHaveBeenCalledWith(['Hollow', 'Knight']);

    await expect(searchGames('   ')).resolves.toEqual({
      games: [],
      status: 'ok',
    });
    expect(searchHltbMock).toHaveBeenCalledTimes(1);
  });

  it('reports a transport failure as unavailable rather than throwing', async () => {
    searchHltbMock.mockResolvedValue({ status: 'failed' });

    await expect(searchGames('Braid')).resolves.toMatchObject({
      reason: 'network',
      status: 'unavailable',
    });
  });

  // A library page holds hundreds of games; without the cap, opening one would fan out
  // into hundreds of simultaneous requests.
  it('never exceeds the concurrency cap', async () => {
    vi.useFakeTimers();
    let active = 0;
    let peak = 0;

    searchHltbMock.mockImplementation(
      async () =>
        await new Promise((resolve) => {
          active += 1;
          peak = Math.max(peak, active);

          setTimeout(() => {
            active -= 1;
            resolve(okResult);
          }, 0);
        }),
    );

    const requests = Promise.all(
      Array.from({ length: 12 }, (_unused, index) =>
        searchGames(`Game ${index}`),
      ),
    );
    await vi.runAllTimersAsync();
    await requests;

    expect(peak).toBeLessThanOrEqual(MAX_CONCURRENT_REQUESTS);
  });

  // The same game can appear several times on one page.
  it('deduplicates concurrent searches for the same title', async () => {
    await Promise.all([
      searchGames('Hollow Knight'),
      searchGames('hollow knight'),
    ]);

    expect(searchHltbMock).toHaveBeenCalledTimes(1);
  });

  it('uses saved searches after a worker restart', async () => {
    await searchGames('Braid');
    resetHltbService();
    resetHltbCache();
    await searchGames('Braid');
    expect(searchHltbMock).toHaveBeenCalledTimes(1);
  });

  it('does not dispatch queued work when the feature is disabled', async () => {
    await hltbSettingsStorageItem.setValue({
      defaultCategory: 'main',
      isEnabled: false,
    });
    await expect(searchGames('Braid')).resolves.toMatchObject({
      status: 'unavailable',
    });
    expect(searchHltbMock).not.toHaveBeenCalled();
  });

  it('stops queued searches after a rate limit and preserves cooldown across restarts', async () => {
    searchHltbMock.mockResolvedValue({ status: 'rate-limited' });
    const responses = await Promise.all(
      Array.from({ length: 12 }, (_, index) => searchGames(`Game ${index}`)),
    );
    expect(
      responses.every((response) => response.status === 'unavailable'),
    ).toBe(true);
    expect(searchHltbMock).toHaveBeenCalledTimes(1);
    const retryAt = await getBlockedUntil();
    expect(responses).toEqual(
      expect.arrayContaining([expect.objectContaining({ retryAt })]),
    );
    resetHltbService();
    resetHltbCache();
    await expect(searchGames('Braid')).resolves.toMatchObject({
      status: 'unavailable',
    });
    expect(searchHltbMock).toHaveBeenCalledTimes(1);
  });

  it('paces uncached searches across callers while cache hits remain immediate', async () => {
    vi.useFakeTimers();
    const dispatched: number[] = [];
    searchHltbMock.mockImplementation(async () => {
      dispatched.push(Date.now());
      return okResult;
    });
    const requests = Promise.all(
      ['Braid', 'Celeste', 'Pokémon Scarlet'].map(searchGames),
    );
    await vi.runAllTimersAsync();
    await requests;
    expect(dispatched.map((time) => time - dispatched[0])).toEqual([
      0, 1000, 2000,
    ]);
    await searchGames('Braid');
    expect(dispatched).toHaveLength(3);
  });

  it('honors a longer server retry deadline for all tabs and across a worker restart', async () => {
    const retryAt = Date.now() + 30 * 60 * 1000;
    searchHltbMock.mockResolvedValue({ retryAt, status: 'rate-limited' });
    await expect(searchGames('Braid')).resolves.toMatchObject({
      retryAt,
      status: 'unavailable',
    });
    resetHltbCache();
    resetHltbService();
    await expect(searchGames('Pokémon Scarlet')).resolves.toMatchObject({
      retryAt,
      status: 'unavailable',
    });
    expect(searchHltbMock).toHaveBeenCalledTimes(1);
  });

  it('returns the existing cooldown deadline even when it is almost over', async () => {
    const retryAt = Date.now() + 5000;
    await setBlockedUntil(retryAt);
    await expect(searchGames('Pokémon Scarlet')).resolves.toMatchObject({
      retryAt,
      status: 'unavailable',
    });
    expect(searchHltbMock).not.toHaveBeenCalled();
  });

  it('honors a preference disabled while a queued search waits for dispatch', async () => {
    vi.useFakeTimers();
    await searchGames('Braid');
    const pending = searchGames('Celeste');
    await vi.advanceTimersByTimeAsync(1);
    await hltbSettingsStorageItem.setValue({
      defaultCategory: 'main',
      isEnabled: false,
    });
    await vi.advanceTimersByTimeAsync(1000);
    expect(await pending).toMatchObject({ status: 'unavailable' });
    expect(searchHltbMock).toHaveBeenCalledTimes(1);
  });

  it.each(['rate-limit', 'exception'])(
    'does not restore outage state after a reset and a late %s',
    async (failure) => {
      let finish: () => void = () => undefined;
      searchHltbMock.mockImplementationOnce(
        async () =>
          await new Promise((resolve, reject) => {
            finish = () =>
              failure === 'rate-limit'
                ? resolve({ status: 'rate-limited' })
                : reject(new Error('offline'));
          }),
      );
      const pending = searchGames('Braid');
      await vi.waitFor(() => expect(searchHltbMock).toHaveBeenCalledTimes(1));
      await clearCache();
      resetHltbFailures();
      finish();
      expect(await pending).toMatchObject({ status: 'unavailable' });
      expect(await getBlockedUntil()).toBe(0);
      expect((await readCache('search:braid')).value).toBeNull();
    },
  );

  describe('circuit breaker', () => {
    // Sequential on purpose: concurrent searches for distinct titles would be
    // deduplicated by title, not by failure.
    const failUntilOpen = async () => {
      searchHltbMock.mockResolvedValue({ status: 'failed' });

      for (let attempt = 0; attempt < 3; attempt += 1) {
        await searchGames(`Game ${attempt}`);
      }

      searchHltbMock.mockClear();
      searchHltbMock.mockResolvedValue(okResult);
    };

    it('stops issuing requests once HowLongToBeat is clearly down', async () => {
      await failUntilOpen();

      await expect(searchGames('Braid')).resolves.toMatchObject({
        reason: 'service-unavailable',
        status: 'unavailable',
      });
      expect(searchHltbMock).not.toHaveBeenCalled();
    });

    it('reopens immediately when the recovery probe fails', async () => {
      await failUntilOpen();
      vi.spyOn(Date, 'now').mockReturnValue(Date.now() + FIVE_MINUTES_MS + 1);
      searchHltbMock.mockResolvedValue({ status: 'failed' });
      await searchGames('Braid');
      await expect(searchGames('Celeste')).resolves.toMatchObject({
        reason: 'service-unavailable',
        status: 'unavailable',
      });
      expect(searchHltbMock).toHaveBeenCalledTimes(1);
    });

    // Recovers on its own, but only after backing off — never by retrying in a loop.
    it('probes again once the cooldown elapses', async () => {
      await failUntilOpen();

      // Faked only for the clock jump: the queue's dispatch stagger uses real timers.
      vi.useFakeTimers();

      try {
        vi.advanceTimersByTime(FIVE_MINUTES_MS + 1);

        await expect(searchGames('Braid')).resolves.toMatchObject({
          status: 'ok',
        });
      } finally {
        vi.useRealTimers();
      }

      expect(searchHltbMock).toHaveBeenCalledTimes(1);
    });
  });
});
