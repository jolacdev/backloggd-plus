import { ReactNode } from 'react';

import Icon, { IconName } from '@globalShared/components/Icon';
import Typography from '@globalShared/components/Typography';

type FeatureSectionProps = {
  children: ReactNode;
  description: string;
  icon: IconName;
  title: string;
};

/** Shared card-style presentation for the different popup features. */
const FeatureSection = ({
  children,
  description,
  icon,
  title,
}: FeatureSectionProps) => (
  <section className="border-border bg-section min-w-0 rounded-lg border p-3 break-words">
    <header className="flex items-center gap-3">
      <span className="text-primary bg-primary/15 grid size-7 shrink-0 place-items-center rounded-md">
        <Icon name={icon} />
      </span>
      <h2 className="min-w-0 text-lg leading-6 font-semibold">{title}</h2>
    </header>
    <Typography className="text-content/75 mt-2" variant="bodySmall">
      {description}
    </Typography>
    {children}
  </section>
);

export default FeatureSection;
