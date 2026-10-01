import { render, screen } from '@testing-library/react';

import Button from './Button';

describe('Button', () => {
  it('uses the primary theme color by default', () => {
    render(<Button>Submit</Button>);

    expect(screen.getByRole('button', { name: 'Submit' })).toHaveClass(
      'bg-primary',
      'text-white',
      'focus-visible:outline-content',
    );
  });

  it('uses the secondary theme color when requested', () => {
    render(<Button variant="secondary">Cancel</Button>);

    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveClass(
      'bg-secondary',
      'border-border',
    );
  });

  it('forwards native props and keeps disabled styling', () => {
    render(
      <Button className="w-full" disabled type="button">
        Submit
      </Button>,
    );

    expect(screen.getByRole('button', { name: 'Submit' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Submit' })).toHaveClass(
      'btn-disabled',
      'opacity-50',
      'w-full',
    );
  });
});
