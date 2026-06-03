import { useMemo } from 'react';
import FoodIcon from './FoodIcon';
import { useFilters } from '../store/filterContext';
import { RiskScenario, ScenarioOrderSample } from '../types/data';
import { FILTER_ALL } from '../utils/constants';
import type { FoodIconName } from '../utils/iconMap';

interface FilterPanelProps {
  scenarios?: RiskScenario[];
  orders?: ScenarioOrderSample[];
  onReset?: () => void;
}

const fallbackOptions = {
  city: ['Metropolitian', 'Urban', 'Semi-Urban', 'Unknown'],
  weather: ['Sunny', 'Cloudy', 'Fog', 'Stormy', 'Sandstorms', 'Windy', 'Unknown'],
  traffic_density: ['Low', 'Medium', 'High', 'Jam', 'Unknown'],
  vehicle_type: ['motorcycle', 'scooter', 'electric_scooter', 'bicycle', 'Unknown'],
  time_period: ['breakfast', 'lunch_peak', 'afternoon', 'dinner_peak', 'night', 'Unknown'],
  is_delayed: ['true', 'false']
};

function valueOf(value: string | null | undefined): string {
  return value && value.trim() ? value : 'Unknown';
}

function uniqueSorted(values: Array<string | null | undefined>, fallback: string[]): string[] {
  const valuesSet = new Set(values.map(valueOf).filter(Boolean));
  return valuesSet.size ? Array.from(valuesSet).sort((a, b) => a.localeCompare(b)) : fallback;
}

export default function FilterPanel({ scenarios = [], orders = [], onReset }: FilterPanelProps) {
  const { filters, setFilter, resetFilters } = useFilters();

  const optionGroups = useMemo(
    () => ({
      city: uniqueSorted(orders.map((order) => order.city), fallbackOptions.city),
      weather: uniqueSorted(
        [...scenarios.map((scenario) => scenario.weather), ...orders.map((order) => order.weather)],
        fallbackOptions.weather
      ),
      traffic_density: uniqueSorted(
        [...scenarios.map((scenario) => scenario.traffic_density), ...orders.map((order) => order.traffic_density)],
        fallbackOptions.traffic_density
      ),
      vehicle_type: uniqueSorted(
        [...scenarios.map((scenario) => scenario.vehicle_type), ...orders.map((order) => order.vehicle_type)],
        fallbackOptions.vehicle_type
      ),
      time_period: uniqueSorted(
        [...scenarios.map((scenario) => scenario.time_period), ...orders.map((order) => order.time_period)],
        fallbackOptions.time_period
      ),
      is_delayed: fallbackOptions.is_delayed
    }),
    [orders, scenarios]
  );

  const filterItems = useMemo(
    () => [
      { key: 'city' as const, label: '城市', options: optionGroups.city },
      { key: 'weather' as const, label: '天气', options: optionGroups.weather },
      { key: 'traffic_density' as const, label: '交通压力', options: optionGroups.traffic_density },
      { key: 'time_period' as const, label: '配送时段', options: optionGroups.time_period },
      { key: 'vehicle_type' as const, label: '载具', options: optionGroups.vehicle_type },
      { key: 'is_delayed' as const, label: '延迟', options: optionGroups.is_delayed }
    ],
    [optionGroups]
  );

  const itemIcons: Record<(typeof filterItems)[number]['key'], FoodIconName> = {
    city: 'area',
    weather: 'weather',
    traffic_density: 'traffic',
    time_period: 'time',
    vehicle_type: 'vehicle',
    is_delayed: 'delay'
  };

  const activeFilters = filterItems
    .filter((item) => filters[item.key] !== FILTER_ALL)
    .map((item) => `${item.label}: ${filters[item.key]}`);

  return (
    <aside className="side-panel filter-panel">
      <div className="panel-heading">
        <div>
          <span className="panel-kicker">Control Tower</span>
          <h2>配送条件筛选 / Delivery Filters</h2>
        </div>
        <button
          type="button"
          onClick={() => {
            resetFilters();
            onReset?.();
          }}
        >
          重置配送条件
        </button>
      </div>
      <div className="filter-stack">
        {filterItems.map((item) => (
          <label className="filter-control" key={item.key}>
            <span>
              <FoodIcon name={itemIcons[item.key]} />
              {item.label}
            </span>
            <select value={filters[item.key]} onChange={(event) => setFilter(item.key, event.target.value)}>
              <option value={FILTER_ALL}>全部</option>
              {item.options.map((option) => (
                <option key={option} value={option}>
                  {item.key === 'is_delayed' ? (option === 'true' ? '延迟订单' : '准时订单') : option}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
      <div className="filter-summary">
        <span>当前分析</span>
        <strong>{activeFilters.length ? activeFilters.join(' / ') : '全量订单'}</strong>
      </div>
    </aside>
  );
}
