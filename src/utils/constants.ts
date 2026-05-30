export const FILTER_ALL = 'all';

export const VIEW_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'distribution', label: 'Time Distribution' },
  { id: 'scatter', label: 'Distance-Time' },
  { id: 'temporal', label: 'Temporal Pattern' },
  { id: 'weather', label: 'Weather & Traffic' },
  { id: 'courier', label: 'Courier & Vehicle' },
  { id: 'city', label: 'City Comparison' },
  { id: 'risk', label: 'Risk Ranking' },
  { id: 'flow', label: 'Delay Flow' },
  { id: 'annotated', label: 'Annotated Time' }
] as const;

export type ViewId = (typeof VIEW_TABS)[number]['id'];
