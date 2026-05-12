import cx from 'classnames';
import { ComponentPropsWithRef } from 'react';

type ButtonProps = {
  variant?: 'primary' | 'secondary';
} & ComponentPropsWithRef<'button'>;

const Button = ({
  children,
  className,
  disabled,
  variant = 'primary',
  ...rest
}: ButtonProps = {}) => (
  <button
    className={cx(
      className,
      'btn h-auto border-transparent px-3 py-1.5 text-base leading-[normal] font-normal text-[#fff] shadow-none',
      {
        'btn-disabled opacity-50': disabled,
        'bg-[var(--back-pink-dk)] hover:bg-[var(--back-pink)]':
          variant === 'primary',
        'border-[var(--back-field-highlight)] bg-[var(--back-interact)] hover:bg-[var(--back-field-highlight)]':
          variant === 'secondary',
      },
    )}
    disabled={disabled}
    {...rest}
  >
    {children}
  </button>
);

export default Button;
