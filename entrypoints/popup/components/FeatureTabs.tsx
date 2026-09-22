import { KeyboardEvent, ReactNode } from 'react';

import Icon, { IconName } from '@globalShared/components/Icon';
import { cn } from '@globalShared/utils/cn';

type FeatureTab = {
  id: string;
  content: ReactNode;
  label: string;
  icon?: IconName;
};

type FeatureTabsProps = {
  tabs: readonly FeatureTab[];
  'aria-label'?: string;
};

/** Shows one feature panel while keeping inactive panels mounted. */
const FeatureTabs = ({ 'aria-label': ariaLabel, tabs }: FeatureTabsProps) => {
  const [activeTabId, setActiveTabId] = useState(tabs[0]?.id);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  /** Moves focus and selection between tabs using standard keyboard controls. */
  const handleTabKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    let nextIndex: number;

    switch (event.key) {
      case 'ArrowRight': // Move to the next tab.
        nextIndex = (index + 1) % tabs.length;
        break;
      case 'ArrowLeft': // Move to the previous tab.
        nextIndex = (index - 1 + tabs.length) % tabs.length;
        break;
      case 'Home': // Move to the first tab.
        nextIndex = 0;
        break;
      case 'End': // Move to the last tab.
        nextIndex = tabs.length - 1;
        break;
      default: // Leave unrelated keys at their default behavior.
        return;
    }

    event.preventDefault();
    setActiveTabId(tabs[nextIndex].id);
    buttons.current[nextIndex]?.focus();
  };

  return (
    <>
      {/* Tabs Navigation */}
      <div
        aria-label={ariaLabel}
        className="border-popup-border mb-2 flex gap-1 overflow-x-auto border-b"
        role="tablist"
      >
        {tabs.map(({ id, icon, label }, index) => (
          <button
            key={id}
            ref={(element) => {
              buttons.current[index] = element;
            }}
            aria-controls={`${id}-panel`}
            aria-selected={id === activeTabId}
            className={cn(
              'flex shrink-0 cursor-pointer items-center gap-2 border-b-2 px-2 py-1.5',
              'text-[13px] leading-5 font-medium whitespace-nowrap outline-offset-[-3px]',
              id === activeTabId
                ? 'border-brand text-brand'
                : 'text-popup-muted hover:text-popup-text border-transparent',
            )}
            id={`${id}-tab`}
            role="tab"
            tabIndex={id === activeTabId ? 0 : -1}
            type="button"
            onClick={() => setActiveTabId(id)}
            onKeyDown={(event) => handleTabKeyDown(event, index)}
          >
            {icon && <Icon name={icon} size={16} />}
            {label}
          </button>
        ))}
      </div>

      {/* Tabs Content */}
      {/* Keep hidden panels mounted so switching cannot discard edits or pending saves. */}
      {tabs.map(({ id, content }) => (
        <div
          key={id}
          aria-labelledby={`${id}-tab`}
          hidden={id !== activeTabId}
          id={`${id}-panel`}
          role="tabpanel"
        >
          {content}
        </div>
      ))}
    </>
  );
};

export default FeatureTabs;
