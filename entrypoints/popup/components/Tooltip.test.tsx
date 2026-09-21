import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Tooltip from './Tooltip';

describe('tooltip', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('uses the optional accessible label and applies a fixed maximum width', async () => {
    const user = userEvent.setup();
    render(<Tooltip aria-label="Helpful text" text="Tooltip content" />);

    await user.hover(screen.getByRole('button', { name: 'Helpful text' }));

    expect(screen.getByRole('tooltip')).toHaveClass(
      'w-max',
      'max-w-[min(16.5rem,calc(100vw-16px))]',
    );
  });

  it.each([
    { directionClass: 'left-0', left: 20, right: 44 },
    { directionClass: 'right-0', left: 356, right: 380 },
  ])(
    'expands toward the available viewport space using $directionClass',
    async ({ directionClass, left, right }) => {
      vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
        bottom: 24,
        height: 24,
        left,
        right,
        top: 0,
        width: 24,
        x: left,
        y: 0,
        toJSON: () => undefined,
      });
      vi.stubGlobal('innerWidth', 400);
      const user = userEvent.setup();
      render(<Tooltip text="Helpful text" />);

      await user.hover(screen.getByRole('button'));

      expect(screen.getByRole('tooltip')).toHaveClass(directionClass);
    },
  );
});
