import { useMemo } from 'react';
import { useFilters } from '../store/filterContext';
import { FILTER_ALL } from '../utils/constants';

const optionGroups = {
  city: ['Metropolitian', 'Urban', 'Semi-Urban', 'Unknown'],
  weather: ['Sunny', 'Cloudy', 'Fog', 'Stormy', 'Sandstorms', 'Windy', 'Unknown'],
  traffic: ['Low', 'Medium', 'High', 'Jam', 'Unknown'],
  vehicle: ['motorcycle', 'scooter', 'electric_scooter', 'bicycle', 'Unknown'],
  timePeriod: ['breakfast', 'lunch_peak', 'afternoon', 'dinner_peak', 'night', 'Unknown']
};

export default function FilterPanel() {
  const { filters, setFilter, resetFilters } = useFilters();
  const filterItems = useMemo(
    () => [
      { key: 'city' as const, label: '城市', options: optionGroups.city },
      { key: 'weather' as const, label: '天气', options: optionGroups.weather },
      { key: 'traffic' as const, label: '交通', options: optionGroups.traffic },
      { key: 'vehicle' as const, label: '车辆', options: optionGroups.vehicle },
      { key: 'timePeriod' as const, label: '时段', options: optionGroups.timePeriod }
    ],
    []
  );

  return (
    <aside className="side-panel">
      <div className="panel-heading">
        <h2>Filters</h2>
        <button type="button" onClick={resetFilters}>
          重置
        </button>
      </div>
      {filterItems.map((item) => (
        <label className="filter-control" key={item.key}>
          <span>{item.label}</span>
          <select value={filters[item.key]} onChange={(event) => setFilter(item.key, event.target.value)}>
            <option value={FILTER_ALL}>全部</option>
            {item.options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      ))}
      <p className="panel-note">筛选状态已全局保存；当前静态骨架主要用于视图联动状态占位。</p>
    </aside>
  );
}
