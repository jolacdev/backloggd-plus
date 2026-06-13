import Button from '@globalShared/components/Button';
import Typography from '@globalShared/components/Typography';

type SettingsActionRowProps = {
  buttonLabel: string;
  description: string;
  title: string;
  onClick: () => void;
};

/**
 * Renders an action row with the Backloggd settings style, containing a title, description and button.
 */
const SettingsActionRow = ({
  buttonLabel,
  description,
  onClick,
  title,
}: SettingsActionRowProps) => (
  <article className="mx-[-15px] mb-[1rem] grid grid-cols-12">
    <div className="col-span-12 px-[15px] md:col-span-8 lg:col-span-9">
      <Typography variant="h4">{title}</Typography>
      <Typography variant="subtitle">{description}</Typography>
    </div>
    <div className="col-span-full my-auto px-[15px] md:col-span-4 lg:col-span-3">
      <Button className="w-full duration-0" onClick={onClick}>
        {buttonLabel}
      </Button>
    </div>
  </article>
);

export default SettingsActionRow;
