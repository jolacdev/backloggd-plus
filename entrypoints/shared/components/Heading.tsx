import { ComponentPropsWithoutRef, ReactNode } from 'react';

import { cn } from '@globalShared/utils/cn';

type HeadingType = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

const SIZE_CLASSES: Record<HeadingType, string> = {
  h1: 'text-[4.5rem]',
  h2: 'text-[2rem]',
  h3: 'text-[1.75rem]',
  h4: 'text-[1.5rem]',
  h5: 'text-[1.25rem]',
  h6: 'text-[1rem]',
};

const MARGIN_CLASSES: Record<HeadingType, string> = {
  h1: 'mb-[1rem]',
  h2: 'mb-[0.5rem]',
  h3: 'mb-[0.25rem]',
  h4: 'mb-[0.25rem]',
  h5: 'mb-[0.25rem]',
  h6: 'mb-[0.25rem]',
};

type HeadingProps = ComponentPropsWithoutRef<HeadingType> & {
  children: ReactNode;
  type: HeadingType;
};

/**
 * Renders a heading with the Backloggd styling.
 * @param type - The type of heading to render.
 * @param props - The rest of the normal HTML heading attributes to pass.
 */
const Heading = ({ children, className, type: Tag, ...rest }: HeadingProps) => (
  <Tag
    {...rest}
    className={cn(
      'leading-[1.2] font-[500] text-[#badefc]',
      SIZE_CLASSES[Tag],
      MARGIN_CLASSES[Tag],
      className,
    )}
  >
    {children}
  </Tag>
);

export default Heading;
