import CheckboxCardBase, {
  CheckboxCardProps,
} from '@globalShared/components/CheckboxCardBase';
import { cn } from '@globalShared/utils/cn';

/** Renders a Backloggd-styled selectable checkbox card. */
const CheckboxCard = ({ checked, children, onChange }: CheckboxCardProps) => (
  <CheckboxCardBase
    cardClassName={cn(
      'min-h-12 gap-3 rounded-md px-3 py-2 text-base transition-colors',
      'hover:border-content/50 focus-within:outline-content',
      checked ? 'border-content/35 bg-secondary/35' : 'border-border bg-field',
    )}
    checkboxClassName="size-5 border-border bg-field text-white hover:border-content/40 checked:border-content/60 checked:bg-secondary checked:text-white"
    checked={checked}
    onChange={onChange}
  >
    {children}
  </CheckboxCardBase>
);

export default CheckboxCard;
