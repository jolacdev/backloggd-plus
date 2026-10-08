import { ComponentPropsWithoutRef, ReactNode } from 'react';

import { cn } from '@globalShared/utils/cn';

type ButtonProps = {
  children: ReactNode;
  variant?: 'primary' | 'secondary';
} & ComponentPropsWithoutRef<'button'>;

/** Renders a themed button with primary or secondary colors. */
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
      'text-base leading-[normal] font-normal text-white',
      'focus-visible:outline-content focus-visible:outline-2 focus-visible:outline-offset-2',
      {
        'bg-primary hover:brightness-110': variant === 'primary',
        'btn-disabled opacity-50': disabled,
        'border-border bg-secondary hover:brightness-110':
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
