import { ComponentPropsWithoutRef, ReactNode } from 'react';

import { cn } from '@globalShared/utils/cn';

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
    className={cn(
      'btn h-auto border-transparent px-3 py-1.5 text-base leading-[normal] font-normal text-[#fff] shadow-none',
      {
        'btn-disabled opacity-50': disabled,
        'bg-[var(--back-pink-dk,#ea377a)] hover:bg-[var(--back-pink,#fc6399)]':
          variant === 'primary',
        'border-[var(--back-field-highlight,#3b4760)] bg-[var(--back-interact,#4a5e8d)] hover:bg-[var(--back-field-highlight,#3b4760)]':
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
