import {
  focusManager,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import { PropsWithChildren } from 'react';

import useHltbGame from '../useHltbGame';

const resolveMock = vi.hoisted(() => vi.fn());
vi.mock('../api', () => ({
  resolveHltbGame: resolveMock,
}));

const meta = {
  igdbId: '194998',
  slug: 'pokemon-scarlet',
  title: 'Pokémon Scarlet',
};
const card = {
  element: document.createElement('div'),
  key: 'scarlet',
  meta,
  mountPoint: document.createElement('div'),
};
let setVisible: (visible: boolean) => void;
const matched = {
  hltbId: 104683,
  name: 'Pokémon Scarlet and Violet',
  status: 'matched',
  times: { all: null, hundred: null, main: 115186, plus: null },
};

describe('visible HLTB resolution recovery', () => {
  let client: QueryClient;
  beforeEach(() => {
    vi.useFakeTimers();
    client = new QueryClient();
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(callback: IntersectionObserverCallback) {
          setVisible = (visible) =>
            callback(
              [{ isIntersecting: visible } as IntersectionObserverEntry],
              this as unknown as IntersectionObserver,
            );
        }
        observe() {
          setVisible(true);
        }
        disconnect() {}
      },
    );
  });
  afterEach(() => {
    client.clear();
    focusManager.setFocused(undefined);
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  const advance = async (ms: number) => {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(ms);
    });
  };

  it('retries at the persisted cooldown deadline and stops after a match', async () => {
    resolveMock
      .mockResolvedValueOnce({
        retryAt: Date.now() + 300000,
        status: 'unavailable',
      })
      .mockResolvedValue(matched);
    const { result } = renderHook(() => useHltbGame(card, 0), {
      wrapper,
    });
    await advance(1);
    expect(result.current?.status).toBe('unavailable');
    await advance(299998);
    expect(resolveMock).toHaveBeenCalledTimes(1);
    await advance(3);
    expect(result.current).toEqual(matched);
    await advance(600000);
    expect(resolveMock).toHaveBeenCalledTimes(2);
  });

  it('pauses retries outside the viewport and recovers when the card returns', async () => {
    resolveMock
      .mockResolvedValueOnce({
        retryAt: Date.now() + 300000,
        status: 'unavailable',
      })
      .mockResolvedValue(matched);
    const { result } = renderHook(() => useHltbGame(card, 0), { wrapper });
    await advance(1);
    act(() => setVisible(false));
    await advance(300001);
    expect(resolveMock).toHaveBeenCalledTimes(1);
    act(() => setVisible(true));
    await advance(2);
    expect(result.current).toEqual(matched);
    expect(resolveMock).toHaveBeenCalledTimes(2);
  });

  it('recovers after a hidden tab returns past the deadline without refetching a settled match', async () => {
    resolveMock
      .mockResolvedValueOnce({
        retryAt: Date.now() + 300000,
        status: 'unavailable',
      })
      .mockResolvedValue(matched);
    const { result } = renderHook(() => useHltbGame(card, 0), {
      wrapper,
    });
    await advance(1);
    focusManager.setFocused(false);
    await advance(300001);
    expect(resolveMock).toHaveBeenCalledTimes(1);
    await act(async () => {
      focusManager.setFocused(true);
    });
    await advance(2);
    expect(result.current).toEqual(matched);
    focusManager.setFocused(false);
    await act(async () => {
      focusManager.setFocused(true);
    });
    await advance(2);
    expect(resolveMock).toHaveBeenCalledTimes(2);
  });

  it('reschedules a prolonged outage and stops after a settled negative match', async () => {
    const start = Date.now();
    resolveMock
      .mockResolvedValueOnce({ retryAt: start + 300000, status: 'unavailable' })
      .mockResolvedValueOnce({ retryAt: start + 900000, status: 'unavailable' })
      .mockResolvedValue({
        status: 'no-match',
      });
    const { result } = renderHook(() => useHltbGame(card, 0), {
      wrapper,
    });
    await advance(300002);
    expect(resolveMock).toHaveBeenCalledTimes(2);
    await advance(599997);
    expect(resolveMock).toHaveBeenCalledTimes(2);
    await advance(3);
    expect(result.current?.status).toBe('no-match');
    await advance(600000);
    expect(resolveMock).toHaveBeenCalledTimes(3);
  });
});
