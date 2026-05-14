import cx from 'classnames';
import { ComponentPropsWithoutRef } from 'react';

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
    className={cx(
      'checkbox shadow-none',
      'rounded-[4px] border border-[var(--back-field-border)]',
      'bg-[var(--back-field-background)] text-[#fff]',
      'hover:border-[var(--back-field-border-hover)]',
    )}
    type="checkbox"
    onChange={(e) => onChange(e.target.checked)}
  />
);

export default Checkbox;
