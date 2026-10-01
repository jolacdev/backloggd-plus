import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import StatusFilters from './StatusFilters';

const filters = {
  backlog: true,
  played: true,
  playing: true,
  wishlist: false,
};

describe('StatusFilters', () => {
  it('lets users toggle a status through its label or keyboard', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<StatusFilters filters={filters} onChange={onChange} />);

    expect(
      screen.getByRole('group', { name: 'features.export.filters.title' }),
    ).toBeInTheDocument();
    await user.click(
      screen.getByText('features.export.filters.status.wishlist'),
    );
    expect(onChange).toHaveBeenCalledWith('wishlist');

    screen
      .getByRole('checkbox', {
        name: 'features.export.filters.status.played',
      })
      .focus();
    await user.keyboard(' ');
    expect(onChange).toHaveBeenCalledWith('played');
  });

  it('disables status changes while an export is running', () => {
    render(
      <StatusFilters filters={filters} isDisabled={true} onChange={vi.fn()} />,
    );
    expect(
      screen.getByRole('checkbox', {
        name: 'features.export.filters.status.backlog',
      }),
    ).toBeDisabled();
  });
});
