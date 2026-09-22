import { ReactNode } from 'react';

import { cn } from '@globalShared/utils/cn';

type TagProps = {
  children: ReactNode;
  className?: string;
};

/** Displays compact, non-interactive metadata. */
const Tag = ({ children, className = undefined }: TagProps) => (
  <span
    className={cn(
      'inline-flex items-center rounded px-2 py-1',
      'bg-[#3b4760] text-xs font-semibold tracking-wide',
      className,
    )}
  >
    {children}
  </span>
);

export default Tag;
