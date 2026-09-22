import CheckboxCardBase, {
  CheckboxCardProps,
} from '@globalShared/components/CheckboxCardBase';
import { cn } from '@globalShared/utils/cn';

/** Renders a compact popup-styled selectable checkbox card. */
const CheckboxCard = ({ checked, children, onChange }: CheckboxCardProps) => (
  <CheckboxCardBase
    cardClassName={cn(
      'min-h-9 gap-2 p-2 text-[13px] leading-[18px] hover:border-[#68758a]',
      'focus-within:outline-[#ff9cc1]',
      checked
        ? 'border-[#604052] bg-[#2b242e]'
        : 'border-popup-border bg-popup-control',
    )}
    checkboxClassName={cn(
      'size-[18px] border-[#748094]',
      'checked:border-action checked:bg-action checked:text-popup',
    )}
    checked={checked}
    onChange={onChange}
  >
    {children}
  </CheckboxCardBase>
);

export default CheckboxCard;
