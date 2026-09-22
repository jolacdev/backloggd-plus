import Icon, { IconName } from '@globalShared/components/Icon';
import Typography from '@globalShared/components/Typography';
import { cn } from '@globalShared/utils/cn';

type TooltipProps = {
  text: string;
  'aria-label'?: string;
  icon?: IconName;
};

type ExpansionDirection = 'left' | 'right';

/** Shows help text on hover, focus, or click. */
const Tooltip = ({
  'aria-label': ariaLabel,
  icon = 'information-outline',
  text,
}: TooltipProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [expansionDirection, setExpansionDirection] =
    useState<ExpansionDirection>('left');
  const containerRef = useRef<HTMLSpanElement>(null);
  const isPointerInside = useRef(false);

  /** Expands the card toward the side with more viewport space. */
  const updateExpansionDirection = useCallback(() => {
    const bounds = containerRef.current?.getBoundingClientRect();
    if (!bounds) return;

    // Measure how far each container edge is from the opposite viewport edge.
    const availableLeft = bounds.right;
    const availableRight = window.innerWidth - bounds.left;

    setExpansionDirection(availableRight >= availableLeft ? 'right' : 'left');
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const dismiss = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setIsOpen(false);
      }
    };

    updateExpansionDirection();

    document.addEventListener('keydown', dismiss);
    window.addEventListener('resize', updateExpansionDirection);
    return () => {
      document.removeEventListener('keydown', dismiss);
      window.removeEventListener('resize', updateExpansionDirection);
    };
  }, [isOpen, updateExpansionDirection]);

  const showTooltip = () => {
    updateExpansionDirection();
    setIsOpen(true);
  };

  return (
    <span
      ref={containerRef}
      className="relative inline-flex shrink-0"
      onMouseEnter={() => {
        isPointerInside.current = true;
        showTooltip();
      }}
      onMouseLeave={(event) => {
        isPointerInside.current = false;
        if (!event.currentTarget.contains(document.activeElement)) {
          setIsOpen(false);
        }
      }}
    >
      <button
        aria-label={ariaLabel}
        className={cn(
          'inline-grid size-6 cursor-pointer place-items-center rounded',
          'text-popup-muted hover:bg-popup-border hover:text-popup-text',
          'focus-visible:bg-popup-border focus-visible:text-popup-text',
        )}
        type="button"
        // Support keyboard interaction
        onBlur={() => {
          if (!isPointerInside.current) setIsOpen(false);
        }}
        onClick={showTooltip}
        onFocus={showTooltip}
      >
        <Icon name={icon} size={16} />
      </button>
      {isOpen && (
        <span
          className={cn(
            'absolute bottom-[calc(100%+8px)] z-10 w-max max-w-[min(16.5rem,calc(100vw-16px))] rounded-md p-2',
            'text-popup-text border border-[#515c6e] bg-[#272c37] shadow-[0_6px_18px_#0006]',
            // Tooltip arrow.
            'before:absolute before:-bottom-[5px] before:size-2 before:rotate-45',
            "before:border-r before:border-b before:border-[#515c6e] before:bg-inherit before:content-['']",
            // Invisible area below the tooltip to keep it open while moving the pointer onto it.
            "after:absolute after:inset-x-0 after:top-full after:h-4 after:content-['']",
            // Position the tooltip and arrow on the side where it expands.
            expansionDirection === 'right'
              ? 'left-0 before:left-[7px]'
              : 'right-0 before:right-[7px]',
          )}
          role="tooltip"
        >
          <Typography as="span" variant="caption">
            {text}
          </Typography>
        </span>
      )}
    </span>
  );
};

export default Tooltip;
