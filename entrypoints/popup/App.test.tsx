import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StrictMode } from 'react';

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
const getOpenExportPageButton = () =>
  screen.getByRole('button', { name: 'gameCollection.openExportPage' });
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
  await screen.findByText('gameCollection.saveHint');
  return view;
};

describe('popup game collection', () => {
  beforeEach(async () => {
    await browser.storage.local.clear();
  });

  it('loads defaults and shows the export button and labeled preferences', async () => {
    await renderPopup();
    expect(
      screen.getByRole('group', { name: /gameCollection.preferences.title/ }),
    ).toBeInTheDocument();
    expect(screen.getByText('gameCollection.saveHint')).toBeInTheDocument();
    expect(checkbox('backlog')).toBeChecked();
    expect(checkbox('played')).toBeChecked();
    expect(checkbox('playing')).toBeChecked();
    expect(checkbox('wishlist')).not.toBeChecked();
  });

  it('opens the Data settings page and closes after navigation succeeds', async () => {
    const createTab = vi.spyOn(browser.tabs, 'create');
    const closePopup = vi
      .spyOn(window, 'close')
      .mockImplementation(() => undefined);
    await renderPopup();
    await userEvent.click(getOpenExportPageButton());
    await waitFor(() => expect(closePopup).toHaveBeenCalledOnce());
    expect(createTab).toHaveBeenCalledWith({
      active: true,
      url: 'https://backloggd.com/settings/data/',
    });
  });

  it('preserves saved selections across popup reopening', async () => {
    const view = await renderPopup();
    await userEvent.click(checkbox('wishlist'));
    await waitFor(async () => {
      expect(await filtersStorageItem.getValue()).toEqual({
        ...defaults,
        wishlist: true,
      });
    });
    view.unmount();
    await renderPopup();
    expect(checkbox('wishlist')).toBeChecked();
  });

  it('supports keyboard access to the export button, tooltip, and status choices', async () => {
    const user = userEvent.setup();
    await renderPopup();
    expect(screen.getByRole('tablist')).toBeInTheDocument();
    await user.tab();
    expect(
      screen.getByRole('tab', { name: 'gameCollection.title' }),
    ).toHaveFocus();
    await user.tab();
    expect(getOpenExportPageButton()).toHaveFocus();
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
