import cx from 'classnames';
import { ComponentPropsWithoutRef, ReactNode } from 'react';

/**
 * Reusable button component with the Backloggd styling.
 */
type ButtonProps = {
  children: ReactNode;
  variant?: 'primary' | 'secondary';
} & ComponentPropsWithoutRef<'button'>;

const Button = ({
  children,
  className,
  disabled,
  variant = 'primary',
  ...rest
}: ButtonProps) => (
  <button
    className={cx(
      'btn h-auto border-transparent px-3 py-1.5 text-base leading-[normal] font-normal text-[#fff] shadow-none',
      {
        'btn-disabled opacity-50': disabled,
        'bg-[var(--back-pink-dk)] hover:bg-[var(--back-pink)]':
          variant === 'primary',
        'border-[var(--back-field-highlight)] bg-[var(--back-interact)] hover:bg-[var(--back-field-highlight)]':
          variant === 'secondary',
      },
      className,
    )}
    disabled={disabled}
    {...rest}
  >
    {children}
  </button>
);

export default Button;
