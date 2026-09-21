/** MDI icons (`https://pictogrammers.com/library/mdi/`) named after their source slug. */
const icons = {
  'information-outline':
    'M11,9H13V7H11M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M11,17H13V11H11V17Z',
};

export type IconName = keyof typeof icons;

type IconProps = {
  name: IconName;
  size?: number;
};

/** Renders a named SVG icon at the requested size. */
const Icon = ({ name, size = 20 }: IconProps) => (
  <svg
    aria-hidden="true"
    fill="currentColor"
    focusable="false"
    height={size}
    viewBox="0 0 24 24"
    width={size}
  >
    <path d={icons[name]} />
  </svg>
);

export default Icon;
