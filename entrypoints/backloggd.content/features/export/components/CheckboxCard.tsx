import CheckboxCardBase, {
  CheckboxCardProps,
} from '@globalShared/components/CheckboxCardBase';
import { cn } from '@globalShared/utils/cn';

/** Renders a Backloggd-styled selectable checkbox card. */
const CheckboxCard = ({ checked, children, onChange }: CheckboxCardProps) => (
  <CheckboxCardBase
    cardClassName={cn(
      'min-h-12 gap-3 rounded-md px-3 py-2 text-base transition-colors hover:border-[#75839a]',
      'focus-within:outline-[#91aaf0]',
      checked
        ? 'border-[#60708d] bg-[#30394a]'
        : 'border-[var(--back-field-border,#3b414e)] bg-[var(--back-field-background,#272c37)]',
    )}
    checkboxClassName="size-5 checked:border-[#8fa9df] checked:bg-[#4a5e8d] checked:text-white"
    checked={checked}
    onChange={onChange}
  >
    {children}
  </CheckboxCardBase>
);

export default CheckboxCard;
