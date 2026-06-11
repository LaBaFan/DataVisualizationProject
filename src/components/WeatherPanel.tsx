import { useInteraction } from '../store/interactionContext';

const weatherOptions = [
  { value: 'All', label: '全部', sublabel: 'All' },
  { value: 'Sunny', label: '晴', sublabel: 'Sunny' },
  { value: 'Fog', label: '雾', sublabel: 'Fog' },
  { value: 'Cloudy', label: '多云', sublabel: 'Cloudy' },
  { value: 'Stormy', label: '暴雨', sublabel: 'Stormy' },
  { value: 'Sandstorms', label: '沙尘', sublabel: 'Sandstorms' },
  { value: 'Windy', label: '大风', sublabel: 'Windy' },
  { value: 'Unknown', label: '未知', sublabel: 'Unknown' }
];

export default function WeatherPanel() {
  const { selectedWeather, setSelectedWeather } = useInteraction();

  return (
    <aside className="weather-panel" aria-label="Weather filters">
      <div className="rail-title">
        <span>Weather</span>
        <strong>天气筛选</strong>
      </div>
      <div className="weather-list">
        {weatherOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            className={selectedWeather === option.value ? 'is-active' : ''}
            onClick={() => setSelectedWeather(option.value)}
          >
            <span>{option.label}</span>
            <small>{option.sublabel}</small>
          </button>
        ))}
      </div>
    </aside>
  );
}
