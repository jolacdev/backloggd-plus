import { ReactNode } from 'react';

import Checkbox from '@globalShared/components/Checkbox';
import { cn } from '@globalShared/utils/cn';

export type CheckboxCardProps = {
  checked: boolean;
  children: ReactNode;
  onChange: (value: boolean) => void;
};

type CheckboxCardBaseProps = CheckboxCardProps & {
  cardClassName: string;
  checkboxClassName: string;
};

/** Provides shared checkbox-card structure for scoped wrappers; do not render directly. */
const CheckboxCardBase = ({
  cardClassName,
  checkboxClassName,
  checked,
  children,
  onChange,
}: CheckboxCardBaseProps) => (
  <label
    className={cn(
      'flex cursor-pointer items-center rounded border',
      'group-disabled:cursor-default group-disabled:opacity-60',
      'focus-within:outline-2 focus-within:outline-offset-2',
      cardClassName,
    )}
  >
    <Checkbox
      checked={checked}
      className={cn('shrink-0 focus-visible:outline-none', checkboxClassName)}
      onChange={onChange}
    />
    {children}
  </label>
);

export default CheckboxCardBase;
