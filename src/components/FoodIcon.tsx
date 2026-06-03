import { FoodIconName, foodIconPaths } from '../utils/iconMap';

interface FoodIconProps {
  name: FoodIconName;
  className?: string;
  title?: string;
}

export default function FoodIcon({ name, className = '', title }: FoodIconProps) {
  return (
    <svg
      className={`food-icon ${className}`.trim()}
      viewBox="0 0 24 24"
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
    >
      {title ? <title>{title}</title> : null}
      <path d={foodIconPaths[name]} />
    </svg>
  );
}
