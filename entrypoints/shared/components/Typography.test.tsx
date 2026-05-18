import { render, screen } from '@testing-library/react';
import { ComponentProps } from 'react';

import Typography from './Typography';

const MOCKED_TEXT = 'Lorem ipsum dolor sit amet.';

describe('Typography', () => {
  describe('Rendering', () => {
    it('renders children correctly', () => {
      render(<Typography variant="body1">{MOCKED_TEXT}</Typography>);
      expect(screen.getByText(MOCKED_TEXT)).toBeInTheDocument();
    });

    it('applies the variant CSS classes to the element', () => {
      render(<Typography variant="h1">{MOCKED_TEXT}</Typography>);
      const el = screen.getByText(MOCKED_TEXT);
      expect(el).toHaveClass('text-[4.5rem]');
    });

    it('merges a custom className without clobbering variant classes', () => {
      render(
        <Typography className="custom-class" variant="h2">
          {MOCKED_TEXT}
        </Typography>,
      );
      const el = screen.getByText(MOCKED_TEXT);
      expect(el).toHaveClass('text-[2rem]');
      expect(el).toHaveClass('custom-class');
    });

    it('merges and replaces custom Tailwind classNames if they collide with variant ones', () => {
      render(
        <Typography className="text-2xl" variant="h1">
          {MOCKED_TEXT}
        </Typography>,
      );
      const el = screen.getByText(MOCKED_TEXT);
      expect(el).toHaveClass('text-2xl');
      expect(el).not.toHaveClass('text-[4.5rem]');
    });
  });

  describe('Default tag resolution from variant', () => {
    const VARIANT_TO_DEFAULT_TAG_NAME: Record<
      ComponentProps<typeof Typography>['variant'],
      string
    > = {
      body1: 'P',
      h1: 'H1',
      h2: 'H2',
      h3: 'H3',
      h4: 'H4',
      h5: 'H5',
      h6: 'H6',
      label: 'LABEL',
      subtitle: 'P',
    };

    it.each(Object.entries(VARIANT_TO_DEFAULT_TAG_NAME))(
      'renders a %s for the %s variant by default',
      (variant, tagName) => {
        // @ts-expect-error - Workarount to test all variants without needing to type explicitly.
        render(<Typography variant={variant}>{MOCKED_TEXT}</Typography>);
        expect(screen.getByText(MOCKED_TEXT).tagName).toBe(tagName);
      },
    );
  });

  describe('Polymorphism via `as` prop', () => {
    it('overrides the default tag when `as` is provided and keeps variant styles', () => {
      render(
        <Typography as="legend" variant="h1">
          {MOCKED_TEXT}
        </Typography>,
      );
      const el = screen.getByText(MOCKED_TEXT);
      expect(el.tagName).toBe('LEGEND');
      expect(el).toHaveClass('text-[4.5rem]');
    });

    it('renders a <label> with htmlFor when `as="label"`', () => {
      render(
        <Typography as="label" htmlFor="my-input" variant="h4">
          {MOCKED_TEXT}
        </Typography>,
      );
      const el = screen.getByText(MOCKED_TEXT);
      expect(el.tagName).toBe('LABEL');
      expect(el).toHaveAttribute('for', 'my-input');
    });
  });

  describe('HTML attribute passthrough', () => {
    it('passes arbitrary HTML attributes to the underlying element', () => {
      render(
        <Typography data-testid="typo" variant="body1">
          {MOCKED_TEXT}
        </Typography>,
      );
      expect(screen.getByTestId('typo')).toBeInTheDocument();
    });

    it('passes htmlFor to a label variant without an explicit `as` prop', () => {
      render(
        <Typography htmlFor="email" variant="label">
          {MOCKED_TEXT}
        </Typography>,
      );
      expect(screen.getByText(MOCKED_TEXT)).toHaveAttribute('for', 'email');
    });
  });
});
