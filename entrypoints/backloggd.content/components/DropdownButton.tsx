import cx from 'classnames';
import { ComponentPropsWithRef } from 'react';

type DropdownButtonProps = {
  label: string;
  onClick: () => void;
} & ComponentPropsWithRef<'button'>;

/**
 * Reusable user dropdown button component that mimics Backloggd styling.
 */
const DropdownButton = ({ label, onClick, ...props }: DropdownButtonProps) => (
  <button
    className={cx(
      'w-full border-none bg-transparent px-[10px] py-[0.25rem]',
      'text-left text-[0.9rem] leading-[normal] font-extralight text-[var(--back-link)]',
      'hover:cursor-pointer hover:bg-[hsla(0,0%,100%,0.188)] hover:text-[#fff]',
    )}
    draggable
    type="button"
    onClick={onClick}
    {...props}
  >
    {label}
  </button>
);

export default DropdownButton;
