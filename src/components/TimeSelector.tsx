import { useInteraction } from '../store/interactionContext';
import { useFilters } from '../store/filterContext';

const timeOptions = [
  { value: 'All', label: '全部', meta: 'All' },
  { value: 'breakfast', label: '早餐', meta: '06-10' },
  { value: 'lunch_peak', label: '午高峰', meta: '10-14' },
  { value: 'afternoon', label: '下午', meta: '14-17' },
  { value: 'dinner_peak', label: '晚高峰', meta: '17-21' },
  { value: 'night', label: '夜间', meta: '21-06' }
];

export default function TimeSelector() {
  const { selectedTimePeriod, setSelectedTimePeriod } = useInteraction();
  const { setFilter } = useFilters();

  return (
    <header className="time-selector-bar">
      <div className="time-brand">
        <strong>FoodETA</strong>
        <span>Delivery ETA Risk Explorer</span>
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
