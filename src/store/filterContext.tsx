import { createContext, ReactNode, useContext, useMemo, useState } from 'react';
import { Filters } from '../types/data';
import { FILTER_ALL } from '../utils/constants';

interface FilterContextValue {
  filters: Filters;
  setFilter: <K extends keyof Filters>(key: K, value: Filters[K]) => void;
  resetFilters: () => void;
}

const defaultFilters: Filters = {
  city: FILTER_ALL,
  weather: FILTER_ALL,
  traffic: FILTER_ALL,
  vehicle: FILTER_ALL,
  timePeriod: FILTER_ALL
};

const FilterContext = createContext<FilterContextValue | null>(null);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<Filters>(defaultFilters);

  const value = useMemo<FilterContextValue>(
    () => ({
      filters,
      setFilter: (key, value) => setFilters((current) => ({ ...current, [key]: value })),
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
