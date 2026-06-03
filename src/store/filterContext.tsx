import { createContext, ReactNode, useContext, useMemo, useState } from 'react';
import { Filters } from '../types/data';
import { FILTER_ALL } from '../utils/constants';

interface FilterContextValue {
  filters: Filters;
  setFilter: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
  patchFilters: (patch: Partial<Filters>) => void;
  resetFilters: () => void;
}

const defaultFilters: Filters = {
  city: FILTER_ALL,
  weather: FILTER_ALL,
  traffic_density: FILTER_ALL,
  time_period: FILTER_ALL,
  vehicle_type: FILTER_ALL,
  is_delayed: FILTER_ALL,
  traffic: FILTER_ALL,
  vehicle: FILTER_ALL,
  timePeriod: FILTER_ALL
};

function normalizeFilterPatch(patch: Partial<Filters>): Partial<Filters> {
  const normalized = { ...patch };

  if (patch.traffic_density !== undefined) normalized.traffic = patch.traffic_density;
  if (patch.traffic !== undefined) normalized.traffic_density = patch.traffic;

  if (patch.vehicle_type !== undefined) normalized.vehicle = patch.vehicle_type;
  if (patch.vehicle !== undefined) normalized.vehicle_type = patch.vehicle;

  if (patch.time_period !== undefined) normalized.timePeriod = patch.time_period;
  if (patch.timePeriod !== undefined) normalized.time_period = patch.timePeriod;

  return normalized;
}

const FilterContext = createContext<FilterContextValue | null>(null);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<Filters>(defaultFilters);

  const value = useMemo<FilterContextValue>(
    () => ({
      filters,
      setFilter: (key, value) => setFilters((current) => ({ ...current, ...normalizeFilterPatch({ [key]: value }) })),
      patchFilters: (patch) => setFilters((current) => ({ ...current, ...normalizeFilterPatch(patch) })),
      resetFilters: () => setFilters(defaultFilters)
    }),
    [filters]
  );

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
}

export function useFilters(): FilterContextValue {
  const value = useContext(FilterContext);
  if (!value) {
    throw new Error('useFilters must be used inside FilterProvider');
  }
  return value;
}
