import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import FeatureTabs from './FeatureTabs';

const renderTabs = () =>
  render(
    <FeatureTabs
      aria-label="Features"
      tabs={[
        {
          id: 'first',
          label: 'First',
          content: (
            <input aria-label="First preference" defaultValue="original" />
          ),
        },
        {
          id: 'second',
          content: <input aria-label="Second preference" />,
          label: 'Second',
        },
        {
          id: 'third',
          content: <input aria-label="Third preference" />,
          label: 'Third',
        },
      ]}
    />,
  );

describe('feature tabs', () => {
  it('shows one panel at a time and preserves edits when switching', async () => {
    const user = userEvent.setup();
    renderTabs();
    await user.type(
      screen.getByRole('textbox', { name: 'First preference' }),
      ' edited',
    );
    await user.click(screen.getByRole('tab', { name: 'Second' }));
    expect(screen.getAllByRole('tabpanel')).toHaveLength(1);
    expect(screen.getByRole('tabpanel')).toHaveAccessibleName('Second');
    expect(
      screen.queryByRole('textbox', { name: 'First preference' }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: 'First' }));
    expect(
      screen.getByRole('textbox', { name: 'First preference' }),
    ).toHaveValue('original edited');
  });

  it('supports arrow-key wrapping, Home, End and Tab into the active panel', async () => {
    const user = userEvent.setup();
    renderTabs();
    await user.tab();
    expect(screen.getByRole('tab', { name: 'First' })).toHaveFocus();
    await user.keyboard('{ArrowLeft}');
    expect(screen.getByRole('tab', { name: 'Third' })).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'First' })).toHaveFocus();
    await user.keyboard('{End}');
    expect(screen.getByRole('tab', { name: 'Third' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await user.keyboard('{Home}{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Second' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await user.tab();
    expect(
      screen.getByRole('textbox', { name: 'Second preference' }),
    ).toHaveFocus();
  });
});
