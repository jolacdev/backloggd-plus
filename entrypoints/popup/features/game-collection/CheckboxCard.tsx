import CheckboxCardBase, {
  CheckboxCardProps,
} from '@globalShared/components/CheckboxCardBase';
import { cn } from '@globalShared/utils/cn';

/** Renders a compact popup-styled selectable checkbox card. */
const CheckboxCard = ({ checked, children, onChange }: CheckboxCardProps) => (
  <CheckboxCardBase
    cardClassName={cn(
      'min-h-9 gap-2 p-2 text-[13px] leading-[18px]',
      'hover:border-[#68758a] focus-within:outline-brand',
      checked ? 'border-[#604052] bg-[#2b242e]' : 'border-border bg-border/20',
    )}
    checkboxClassName={cn(
      'size-[18px] border-[#748094]',
      'checked:border-primary checked:bg-primary checked:text-background',
    )}
    checked={checked}
    onChange={onChange}
  >
    {children}
  </CheckboxCardBase>
);

export default CheckboxCard;
