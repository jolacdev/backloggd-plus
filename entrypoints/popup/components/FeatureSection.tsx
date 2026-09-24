import { ReactNode } from 'react';

import Icon, { IconName } from '@globalShared/components/Icon';
import Typography from '@globalShared/components/Typography';

type FeatureSectionProps = {
  id: string;
  children: ReactNode;
  description: string;
  icon: IconName;
  title: string;
};

/** Shared card-style presentation for the different popup features. */
const FeatureSection = ({
  id,
  children,
  description,
  icon,
  title,
}: FeatureSectionProps) => (
  <section
    aria-labelledby={`${id}-title`}
    className="border-border bg-section min-w-0 rounded-lg border p-3 break-words"
    id={id}
  >
    <header className="flex items-center gap-3">
      <span
        aria-hidden="true"
        className="text-brand bg-brand/15 grid size-7 shrink-0 place-items-center rounded-md"
      >
        <Icon name={icon} />
      </span>
      <h2
        className="min-w-0 text-lg leading-6 font-semibold"
        id={`${id}-title`}
      >
        {title}
      </h2>
    </header>
    <Typography className="text-content/75 mt-2" variant="bodySmall">
      {description}
    </Typography>
    {children}
  </section>
);

export default FeatureSection;
