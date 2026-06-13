import { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';

import { cn } from '@globalShared/utils/cn';

const DEFAULT_VARIANT_MAPPING = {
  body1: 'p',
  body2: 'p',
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  h5: 'h5',
  h6: 'h6',
  label: 'label',
  subtitle: 'p',
} as const satisfies Record<string, ElementType>;

type TypographyVariant = keyof typeof DEFAULT_VARIANT_MAPPING;

type VariantTagMap = typeof DEFAULT_VARIANT_MAPPING;

const VARIANT_CLASSES: Record<keyof typeof DEFAULT_VARIANT_MAPPING, string> = {
  body1: 'mb-0 text-[1rem] leading-[1.5] font-[200] text-[#fff]',
  body2: 'mb-0 text-[1rem] leading-[1.5] font-[400] text-[#fff]',
  h1: 'mb-[1rem] text-[4.5rem] leading-[1.2] font-[500] text-[var(--back-text,#badefc)]',
  h2: 'mb-[0.5rem] text-[2rem] leading-[1.2] font-[500] text-[var(--back-text,#badefc)]',
  h3: 'mb-[0.25rem] text-[1.75rem] leading-[1.2] font-[500] text-[var(--back-text,#badefc)]',
  h4: 'mb-[0.25rem] text-[1.5rem] leading-[1.2] font-[500] text-[var(--back-text,#badefc)]',
  h5: 'mb-[0.25rem] text-[1.25rem] leading-[1.2] font-[500] text-[var(--back-text,#badefc)]',
  h6: 'mb-[0.25rem] text-[1rem] leading-[1.2] font-[500] text-[var(--back-text,#badefc)]',
  label: 'mb-0 text-[1rem] leading-[1.5] font-[200] text-[#fff]',
  subtitle:
    'mb-0 text-[1rem] font-[300] leading-[1.5] text-[var(--back-text-secondary,#8f9ca7)]',
};

type TypographyOwnProps<
  V extends TypographyVariant,
  T extends ElementType | undefined,
> = {
  children: ReactNode;
  variant: V; // The visual style of the tag.
  as?: T; // The actual HTML tag.
};

/**
 * - Merges own props with element props for the chosen tag (e.g. `htmlFor` when `as="label"`).
 * - If `as` is omitted, `T` defaults to `undefined`, and HTML props are validated against `VariantTagMap[V]`.
 * - The `children` key is re-declared in `TypographyOwnProps` to ensure it is always required for the component.
 */
export type TypographyProps<
  V extends TypographyVariant = 'body1',
  T extends ElementType | undefined = undefined,
> = TypographyOwnProps<V, T> &
  Omit<
    ComponentPropsWithoutRef<T extends ElementType ? T : VariantTagMap[V]>,
    keyof TypographyOwnProps<V, T>
  >;

/**
 * Versatile, polymorphic text component following Backloggd style.
 * @param variant - The visual style of the component. Also determines the HTML tag if `as` is not provided.
 * @param as - The HTML tag to render. Takes precedence over `variant`'s default HTML tag.
 * @param className - Additional CSS classes to apply.
 * @param children - The content of the component.
 * @param rest - Additional HTML attributes to pass to the component.
 *
 * @examples
 * ```tsx
 * <Typography as="p" variant="h1">Title</Typography>
 * <Typography as="label" variant="h3" htmlFor="email">Email</Typography>
 * ```
 */
const Typography = <
  V extends TypographyVariant = 'body1',
  T extends ElementType | undefined = undefined,
>({
  as = undefined,
  children,
  className,
  variant,
  ...rest
}: TypographyProps<V, T>) => {
  const Tag = (as ?? DEFAULT_VARIANT_MAPPING[variant]) as ElementType;

  return (
    <Tag {...rest} className={cn(VARIANT_CLASSES[variant], className)}>
      {children}
    </Tag>
  );
};

export default Typography;
