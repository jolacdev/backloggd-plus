import { ComponentPropsWithoutRef, ReactNode } from 'react';

import { cn } from '@globalShared/utils/cn';

type ButtonProps = {
  children: ReactNode;
  variant?: 'primary' | 'secondary';
} & ComponentPropsWithoutRef<'button'>;

/** Renders a Backloggd-styled button with primary or secondary colors. */
const Button = ({
  children,
  className,
  disabled,
  variant = 'primary',
  ...rest
}: ButtonProps) => (
  <button
    className={cn(
      'btn h-auto border-transparent px-3 py-1.5 shadow-none',
      'text-base leading-[normal] font-normal text-[#fff]',
      'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a6cfff]',
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
