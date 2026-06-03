import FoodIcon from './FoodIcon';

interface RouteDecorationProps {
  compact?: boolean;
}

export default function RouteDecoration({ compact = false }: RouteDecorationProps) {
  return (
    <div className={`route-decoration ${compact ? 'compact' : ''}`.trim()} aria-hidden="true">
      <svg viewBox="0 0 360 120" preserveAspectRatio="none">
        <path className="route-line" d="M34 82 C86 18 146 28 178 64 S270 116 326 38" />
        <path className="route-line secondary" d="M54 96 C116 94 134 42 194 42 S260 70 308 24" />
        <circle cx="34" cy="82" r="5" />
        <circle cx="178" cy="64" r="5" />
        <circle cx="326" cy="38" r="5" />
      </svg>
      <span className="route-node restaurant">
        <FoodIcon name="restaurant" />
      </span>
      <span className="route-node rider">
        <FoodIcon name="rider" />
      </span>
      <span className="route-node customer">
        <FoodIcon name="customer" />
      </span>
    </div>
  );
}
