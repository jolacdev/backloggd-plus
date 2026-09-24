import { ComponentPropsWithoutRef } from 'react';

import { cn } from '@globalShared/utils/cn';

type CheckboxProps = Omit<
  ComponentPropsWithoutRef<'input'>,
  'onChange' | 'type'
> & {
  checked: boolean;
  onChange: (value: boolean) => void;
};

/** Renders a raw controlled checkbox. */
const Checkbox = ({ checked, className, onChange, ...rest }: CheckboxProps) => (
  <input
    // eslint-disable-next-line react/jsx-props-no-spreading
    {...rest}
    checked={checked} // NOTE: Using 'checked' instead of 'defaultChecked' to be a controlled component.
    className={cn(
      'checkbox shadow-none',
      'rounded border',
      'disabled:opacity-40',
      className,
    )}
    type="checkbox"
    onChange={(e) => onChange(e.target.checked)}
  />
);

export default Checkbox;
