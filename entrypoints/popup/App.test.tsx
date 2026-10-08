import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StrictMode } from 'react';

import {
  filtersStorageItem,
  preferencesStorageItem,
} from '@globalShared/storage';

import App from './App';

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
const openSettings = async () =>
  await userEvent.click(
    screen.getByRole('button', { name: 'settings.aria.open' }),
  );
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

  it('keeps the global logging preference outside feature panels and saves it across reopening', async () => {
    const view = await renderPopup();
    expect(
      screen.queryByRole('checkbox', { name: 'settings.logging' }),
    ).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('tab', { name: 'hltb.title' }));
    await openSettings();
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
    const logging = screen.getByRole('checkbox', { name: 'settings.logging' });
    await waitFor(() => expect(logging).toBeEnabled());
    expect(logging).not.toBeChecked();
    expect(logging.closest('[role="tabpanel"]')).toBeNull();
    await userEvent.click(logging);
    await waitFor(async () =>
      expect(await preferencesStorageItem.getValue()).toEqual({
        isLoggingEnabled: true,
      }),
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'settings.aria.back' }),
    );
    expect(screen.getByRole('tab', { name: 'hltb.title' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(logging).not.toBeVisible();
    await openSettings();
    expect(logging).toBeChecked();
    view.unmount();
    await renderPopup();
    await openSettings();
    await waitFor(() =>
      expect(
        screen.getByRole('checkbox', { name: 'settings.logging' }),
      ).toBeChecked(),
    );
  });

  it('shows a failed logging preference save without enabling it', async () => {
    await renderPopup();
    await openSettings();
    const logging = screen.getByRole('checkbox', { name: 'settings.logging' });
    await waitFor(() => expect(logging).toBeEnabled());
    vi.spyOn(preferencesStorageItem, 'setValue').mockRejectedValue(
      new Error('Storage unavailable'),
    );
    await userEvent.click(logging);
    expect(await screen.findByText('settings.saveError')).toBeVisible();
    expect(logging).not.toBeChecked();
  });

  it('supports keyboard access to the export button, tooltip, and status choices', async () => {
    const user = userEvent.setup();
    await renderPopup();
    expect(screen.getByRole('tablist')).toBeInTheDocument();
    await user.tab();
    expect(
      screen.getByRole('button', { name: 'settings.aria.open' }),
    ).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(
      screen.getByRole('heading', { name: 'settings.title' }),
    ).toBeVisible();
    await user.tab();
    expect(
      screen.getByRole('checkbox', { name: 'settings.logging' }),
    ).toHaveFocus();
    await user.tab({ shift: true });
    expect(
      screen.getByRole('button', { name: 'settings.aria.back' }),
    ).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(
      screen.getByRole('button', { name: 'settings.aria.open' }),
    ).toHaveFocus();
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
