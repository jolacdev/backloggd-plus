import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StrictMode } from 'react';

import { useExportStatusFilters } from '@globalShared/hooks/useExportStatusFilters';
import { filtersStorageItem } from '@globalShared/storage';

import App from './App';

// Reuse WxtVitest's global fake browser without loading its build-tool barrel
// through the installed version's virtual browser module in jsdom.
vi.mock('wxt/browser', async () => {
  const { fakeBrowser: testBrowser } = await import('wxt/testing/fake-browser');
  return { browser: testBrowser };
});

const defaults = {
  backlog: true,
  played: true,
  playing: true,
  wishlist: false,
};
const action = () =>
  screen.getByRole('button', { name: 'gameCollection.action' });
const checkbox = (status: string) =>
  screen.getByRole('checkbox', {
    name: `features.export.filters.status.${status}`,
  });
const renderPopup = async () => {
  const view = render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
  await waitFor(() => expect(action()).toBeEnabled());
  return view;
};

const deferred = () => {
  let resolve!: () => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, reject, resolve };
};

describe('popup game collection', () => {
  beforeEach(async () => {
    await browser.storage.local.clear();
    vi.spyOn(window, 'close').mockImplementation(() => undefined);
  });

  it('loads defaults and keeps the action and labeled preferences visible', async () => {
    await renderPopup();
    expect(
      screen.getByRole('group', { name: /gameCollection.preferences.title/ }),
    ).toBeInTheDocument();
    expect(screen.getByText('gameCollection.save.idle')).toBeInTheDocument();
    expect(checkbox('backlog')).toBeChecked();
    expect(checkbox('played')).toBeChecked();
    expect(checkbox('playing')).toBeChecked();
    expect(checkbox('wishlist')).not.toBeChecked();
  });

  it.each(['https://backloggd.com/u/test/games/', 'https://example.com/'])(
    'opens the exact Data settings URL from %s and closes only after success',
    async (url) => {
      await browser.tabs.create({ active: true, url });
      const createTab = vi.spyOn(browser.tabs, 'create');
      await renderPopup();
      await userEvent.click(action());
      await waitFor(() => expect(window.close).toHaveBeenCalledOnce());
      expect(createTab).toHaveBeenCalledWith({
        active: true,
        url: 'https://backloggd.com/settings/data/',
      });
    },
  );

  it('preserves saved selections across popup reopening and dialog-local edits', async () => {
    const view = await renderPopup();
    await userEvent.click(checkbox('wishlist'));
    await screen.findByText('gameCollection.save.saved');
    view.unmount();
    await renderPopup();
    expect(checkbox('wishlist')).toBeChecked();
    const dialog = renderHook(() => useExportStatusFilters());
    await waitFor(() =>
      expect(dialog.result.current.hasLoadedStatuses).toBe(true),
    );
    expect(dialog.result.current.filters.wishlist).toBe(true);
    act(() => dialog.result.current.toggleStatusFilter('wishlist'));
    expect(dialog.result.current.filters.wishlist).toBe(false);
    expect(await filtersStorageItem.getValue()).toEqual({
      ...defaults,
      wishlist: true,
    });
  });

  it('returns to the automatic-save hint and does not let an old confirmation clear a newer pending save', async () => {
    await renderPopup();
    vi.useFakeTimers();
    try {
      const first = deferred();
      const second = deferred();
      vi.spyOn(filtersStorageItem, 'setValue')
        .mockReturnValueOnce(first.promise)
        .mockReturnValueOnce(second.promise);
      fireEvent.click(checkbox('wishlist'));
      await act(async () => first.resolve());
      expect(screen.getByText('gameCollection.save.saved')).toBeInTheDocument();
      act(() => vi.advanceTimersByTime(1500));
      fireEvent.click(checkbox('backlog'));
      await act(async () => vi.advanceTimersByTimeAsync(1000));
      expect(
        screen.getByText('gameCollection.save.saving'),
      ).toBeInTheDocument();
      await act(async () => second.resolve());
      act(() => vi.advanceTimersByTime(2999));
      expect(screen.getByText('gameCollection.save.saved')).toBeInTheDocument();
      act(() => vi.advanceTimersByTime(1));
      expect(screen.getByText('gameCollection.save.idle')).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('serializes rapid edits and waits for the latest write before navigation', async () => {
    const first = deferred();
    const second = deferred();
    const write = vi
      .spyOn(filtersStorageItem, 'setValue')
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    const createTab = vi.spyOn(browser.tabs, 'create');
    await renderPopup();
    await userEvent.click(checkbox('backlog'));
    expect(write).toHaveBeenCalledTimes(1);
    fireEvent.click(checkbox('wishlist'));
    fireEvent.click(checkbox('playing'));
    fireEvent.click(action());
    expect(screen.getByText('gameCollection.save.saving')).toBeInTheDocument();
    expect(createTab).not.toHaveBeenCalled();
    await act(async () => first.resolve());
    expect(write).toHaveBeenCalledTimes(2);
    expect(write).toHaveBeenLastCalledWith({
      backlog: false,
      played: true,
      playing: false,
      wishlist: true,
    });
    expect(createTab).not.toHaveBeenCalled();
    expect(window.close).not.toHaveBeenCalled();
    await act(async () => second.resolve());
    expect(createTab).toHaveBeenCalledOnce();
    expect(window.close).toHaveBeenCalledOnce();
  });

  it('retains failed selections, blocks navigation, and retries the latest values', async () => {
    const pending = deferred();
    const write = vi
      .spyOn(filtersStorageItem, 'setValue')
      .mockReturnValueOnce(pending.promise);
    const createTab = vi.spyOn(browser.tabs, 'create');
    await renderPopup();
    await userEvent.click(checkbox('wishlist'));
    fireEvent.click(action());
    await act(async () => pending.reject(new Error('Storage unavailable')));
    expect(screen.getByText('gameCollection.save.error')).toBeInTheDocument();
    expect(checkbox('wishlist')).toBeChecked();
    expect(createTab).not.toHaveBeenCalled();
    expect(window.close).not.toHaveBeenCalled();
    await userEvent.click(
      screen.getByRole('button', { name: 'gameCollection.retry' }),
    );
    await screen.findByText('gameCollection.save.saved');
    expect(write).toHaveBeenLastCalledWith({ ...defaults, wishlist: true });
    expect(await filtersStorageItem.getValue()).toEqual({
      ...defaults,
      wishlist: true,
    });
  });

  it('offers a retry for failed initial reads without overwriting saved preferences', async () => {
    await filtersStorageItem.setValue({ ...defaults, played: false });
    const read = vi
      .spyOn(filtersStorageItem, 'getValue')
      .mockRejectedValue(new Error('Read failed'));
    const write = vi.spyOn(filtersStorageItem, 'setValue');
    render(<App />);
    await screen.findByText('gameCollection.loadError');
    expect(action()).toBeDisabled();
    expect(checkbox('backlog')).toBeDisabled();
    read.mockRestore();
    await userEvent.click(
      screen.getByRole('button', { name: 'gameCollection.retry' }),
    );
    await waitFor(() => expect(action()).toBeEnabled());
    expect(checkbox('played')).not.toBeChecked();
    expect(write).not.toHaveBeenCalled();
  });

  it('shows an actionable navigation failure and allows another attempt', async () => {
    const createTab = vi
      .spyOn(browser.tabs, 'create')
      .mockRejectedValueOnce(new Error('Tabs unavailable'));
    await renderPopup();
    await userEvent.click(action());
    await screen.findByText('gameCollection.navigationError');
    expect(window.close).not.toHaveBeenCalled();
    expect(action()).toBeEnabled();
    await userEvent.click(action());
    await waitFor(() => expect(window.close).toHaveBeenCalledOnce());
    expect(createTab).toHaveBeenCalledTimes(2);
  });

  it('supports keyboard action, tooltip dismissal, checkbox labels, hover and click', async () => {
    const user = userEvent.setup();
    await renderPopup();
    expect(screen.getByRole('tablist')).toBeInTheDocument();
    await user.tab();
    expect(
      screen.getByRole('tab', { name: 'gameCollection.title' }),
    ).toHaveFocus();
    await user.tab();
    expect(action()).toHaveFocus();
    await user.tab();
    const info = screen.getByRole('button', {
      name: 'gameCollection.preferences.tooltip',
    });
    expect(info).toHaveFocus();
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    expect(info).toHaveFocus();
    await user.click(info);
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    await user.unhover(info);
    await user.tab();
    expect(checkbox('backlog')).toHaveFocus();
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    await user.keyboard(' ');
    expect(checkbox('backlog')).not.toBeChecked();
    await user.hover(info);
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    await user.unhover(info);
    await user.hover(info);
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    await user.unhover(info);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });
});
