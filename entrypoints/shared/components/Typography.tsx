import { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';

import { cn } from '@globalShared/utils/cn';

const DEFAULT_VARIANT_MAPPING = {
  body1: 'p',
  body2: 'p',
  bodyCompact: 'p',
  bodySmall: 'p',
  caption: 'p',
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  h5: 'h5',
  h6: 'h6',
  label: 'label',
  labelSmall: 'label',
  subtitle: 'p',
} as const satisfies Record<string, ElementType>;

type TypographyVariant = keyof typeof DEFAULT_VARIANT_MAPPING;

type VariantTagMap = typeof DEFAULT_VARIANT_MAPPING;

const VARIANT_CLASSES: Record<keyof typeof DEFAULT_VARIANT_MAPPING, string> = {
  body1: 'mb-0 text-base leading-normal font-extralight text-white',
  body2: 'mb-0 text-base leading-normal font-normal text-white',
  bodyCompact: 'mb-0 text-sm leading-5 font-normal text-content/70',
  bodySmall: 'mb-0 text-[13px] leading-5 font-normal',
  caption: 'mb-0 text-xs leading-[18px] font-normal',
  h1: 'mb-4 text-[4.5rem] leading-[1.2] font-medium text-content',
  h2: 'mb-2 text-[2rem] leading-[1.2] font-medium text-content',
  h3: 'mb-1 text-[1.75rem] leading-[1.2] font-medium text-content',
  h4: 'mb-1 text-2xl leading-[1.2] font-medium text-content',
  h5: 'mb-1 text-xl leading-[1.2] font-medium text-content',
  h6: 'mb-1 text-base leading-[1.2] font-medium text-content',
  label: 'mb-0 text-base leading-normal font-extralight text-white',
  labelSmall: 'mb-0 text-[13px] leading-6 font-semibold',
  subtitle: 'mb-0 text-base leading-normal font-light text-content/70',
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
 * Versatile, polymorphic text component providing Backloggd and shared extension text styles.
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
