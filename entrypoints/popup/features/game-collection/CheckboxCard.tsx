import CheckboxCardBase, {
  CheckboxCardProps,
} from '@globalShared/components/CheckboxCardBase';
import { cn } from '@globalShared/utils/cn';

/** Renders a compact popup-styled selectable checkbox card. */
const CheckboxCard = ({ checked, children, onChange }: CheckboxCardProps) => (
  <CheckboxCardBase
    cardClassName={cn(
      'min-h-9 gap-2 p-2 text-[13px] leading-[18px]',
      'hover:border-content/35 focus-within:outline-content',
      checked
        ? 'border-primary/35 bg-primary/10'
        : 'border-border bg-border/20',
    )}
    checkboxClassName={cn(
      'size-[18px] border-content/45 bg-border/40 text-white hover:border-content/45',
      'checked:border-primary checked:bg-primary checked:text-background',
    )}
    checked={checked}
    onChange={onChange}
  >
    {children}
  </CheckboxCardBase>
);

export default CheckboxCard;
