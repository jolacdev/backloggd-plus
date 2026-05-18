import { ComponentPropsWithoutRef } from 'react';

import { cn } from '@globalShared/utils/cn';

type CheckboxProps = Omit<
  ComponentPropsWithoutRef<'input'>,
  'onChange' | 'type'
> & {
  checked: boolean;
  onChange: (value: boolean) => void;
};

const Checkbox = ({ checked, onChange, ...rest }: CheckboxProps) => (
  <input
    // eslint-disable-next-line react/jsx-props-no-spreading
    {...rest}
    checked={checked} // NOTE: Using 'checked' instead of 'defaultChecked' to be a controlled component.
    className={cn(
      'checkbox shadow-none',
      'rounded-[4px] border border-[var(--back-field-border,#3b414e)]',
      'bg-[var(--back-field-background,#272c37)] text-[#fff]',
      'hover:border-[var(--back-field-border-hover,#3f4b64)]',
    )}
    type="checkbox"
    onChange={(e) => onChange(e.target.checked)}
  />
);

export default Checkbox;
