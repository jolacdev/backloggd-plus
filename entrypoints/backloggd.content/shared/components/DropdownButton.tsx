import cx from 'classnames';
import { ComponentPropsWithoutRef } from 'react';

type DropdownButtonProps = Omit<
  ComponentPropsWithoutRef<'button'>,
  'onClick' | 'type'
> & {
  label: string;
  onClick: () => void;
};

/**
 * Reusable user dropdown button component that mimics Backloggd styling.
 */
const DropdownButton = ({
  className,
  label,
  onClick,
  ...props
}: DropdownButtonProps) => (
  <button
    {...props}
    className={cx(
      'w-full border-none bg-transparent px-[10px] py-[0.25rem]',
      'text-left text-[0.9rem] leading-[normal] font-extralight text-[var(--back-link)]',
      'hover:cursor-pointer hover:bg-[hsla(0,0%,100%,0.188)] hover:text-[#fff]',
      className,
    )}
    draggable
    type="button"
    onClick={onClick}
  >
    {label}
  </button>
);

export default DropdownButton;
