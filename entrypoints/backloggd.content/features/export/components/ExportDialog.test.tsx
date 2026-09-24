import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { filtersStorageItem } from '@globalShared/storage';

import ExportDialog from './ExportDialog';

const fetchData = vi.hoisted(() => vi.fn());

vi.mock('wxt/browser', async () => {
  const { fakeBrowser: testBrowser } = await import('wxt/testing/fake-browser');
  return { browser: testBrowser };
});

vi.mock('../hooks/useExport', () => ({
  default: () => ({
    fetchData,
    gameDetails: [],
    progress: { current: 0, phase: 'idle', total: 0 },
    isComplete: false,
    isError: false,
  }),
}));

it('requires a status before exporting and keeps dialog selections temporary', async () => {
  await browser.storage.local.clear();
  await filtersStorageItem.setValue({
    backlog: false,
    played: false,
    playing: false,
    wishlist: false,
  });
  HTMLDialogElement.prototype.showModal = vi.fn();
  HTMLDialogElement.prototype.close = vi.fn();

  const user = userEvent.setup();
  render(<ExportDialog username="tester" onClose={vi.fn()} />);
  const submit = await screen.findByText('features.export.dialog.submit');
  expect(submit.closest('button')).toBeDisabled();
  expect(
    screen.getByText('features.export.dialog.cancel').closest('button'),
  ).toBeEnabled();
  await user.click(submit);
  expect(fetchData).not.toHaveBeenCalled();

  await user.click(screen.getByText('features.export.filters.status.backlog'));
  await waitFor(() => expect(submit.closest('button')).toBeEnabled());
  await user.click(submit);
  expect(fetchData).toHaveBeenCalledWith({
    backlog: true,
    played: false,
    playing: false,
    wishlist: false,
  });
  expect((await filtersStorageItem.getValue()).backlog).toBe(false);
});
