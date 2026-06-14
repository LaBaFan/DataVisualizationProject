import { useInteraction } from '../store/interactionContext';
import { useFilters } from '../store/filterContext';

const timeOptions = [
  { value: 'All', label: '全部', meta: 'All' },
  { value: 'breakfast', label: '早', meta: 'Morning' },
  { value: 'lunch_peak', label: '中', meta: 'Noon' },
  { value: 'afternoon', label: '下午', meta: 'Afternoon' },
  { value: 'dinner_peak', label: '晚', meta: 'Evening' },
  { value: 'night', label: '夜间', meta: 'Night' }
];

export default function TimeSelector() {
  const { selectedTimePeriod, setSelectedTimePeriod } = useInteraction();
  const { setFilter } = useFilters();

  return (
    <header className="time-selector-bar">
      <div className="time-brand">
        <strong>FoodETA</strong>
        <span>Scrolling ETA Risk Story</span>
      </div>
      <nav aria-label="Time period selector">
        {timeOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            className={selectedTimePeriod === option.value ? 'is-active' : ''}
            onClick={() => {
              setSelectedTimePeriod(option.value);
              setFilter('time_period', option.value);
            }}
          >
            <span>{option.label}</span>
            <small>{option.meta}</small>
          </button>
        ))}
      </nav>
    </header>
  );
}
