// @vitest-environment node
// The queue and the circuit breaker are exercised through the operation they guard, with
// the transport mocked — the client has its own suite.
import { resetHltbService, searchGames } from '../service';

const searchHltbMock = vi.hoisted(() => vi.fn());

vi.mock('../client', () => ({ searchHltb: searchHltbMock }));

const MAX_CONCURRENT_REQUESTS = 3;
const FIVE_MINUTES_MS = 5 * 60 * 1000;

const okResult = {
  games: [{ hltbId: 1, name: 'Braid', times: {} }],
  status: 'ok',
};

describe('searchGames', () => {
  beforeEach(() => {
    resetHltbService();
    searchHltbMock.mockReset();
    searchHltbMock.mockResolvedValue(okResult);
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

    await expect(searchGames('Braid')).resolves.toEqual({
      reason: 'network',
      status: 'unavailable',
    });
  });

  // A library page holds hundreds of games; without the cap, opening one would fan out
  // into hundreds of simultaneous requests.
  it('never exceeds the concurrency cap', async () => {
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

    await Promise.all(
      Array.from({ length: 12 }, (_unused, index) =>
        searchGames(`Game ${index}`),
      ),
    );

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

      await expect(searchGames('Braid')).resolves.toEqual({
        reason: 'service-unavailable',
        status: 'unavailable',
      });
      expect(searchHltbMock).not.toHaveBeenCalled();
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
