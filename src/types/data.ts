export type Nullable<T> = T | null;

export interface MetricSummary {
  order_count: number;
  avg_delivery_duration_min: number;
  median_delivery_duration_min?: number;
  p75_delivery_duration_min?: number;
  avg_distance_km?: number;
  delay_rate: number;
}

export interface OverviewSummary {
  total_orders: number;
  valid_orders: number;
  avg_delivery_duration_min: number;
  median_delivery_duration_min: number;
  delay_threshold_min: number;
  delay_rate: number;
  avg_distance_km: number;
  city_count: number;
  weather_categories: number;
  traffic_density_categories: number;
  order_count: number;
  p75_delivery_duration_min: number;
  min_delivery_duration_min: number;
  max_delivery_duration_min: number;
  median_distance_km: number;
  avg_speed_kmph: number;
}

export interface DistributionBin {
  range: string;
  count: number;
}

export interface DeliveryTimeDistribution {
  bins: DistributionBin[];
  quantiles: Record<string, number>;
}

export interface DistanceTimePoint {
  order_id: string;
  distance_km: number;
  delivery_duration_min: number;
  weather: Nullable<string>;
  traffic_density: Nullable<string>;
  vehicle_type: Nullable<string>;
  delivery_person_ratings: Nullable<string>;
  multiple_deliveries: Nullable<string>;
  city: Nullable<string>;
  time_period: Nullable<string>;
  is_delayed: boolean;
}

export interface HourSummary extends MetricSummary {
  order_hour: number;
}

export interface TimePeriodSummary extends MetricSummary {
  time_period: Nullable<string>;
}

export interface WeatherTrafficSummary extends MetricSummary {
  weather: Nullable<string>;
  traffic_density: Nullable<string>;
}

export interface CourierVehicleSummary {
  by_vehicle_type: Array<MetricSummary & { vehicle_type: Nullable<string> }>;
  by_rating_bin: Array<MetricSummary & { rating_bin: Nullable<string> }>;
  by_age_bin: Array<MetricSummary & { age_bin: Nullable<string> }>;
}

export interface CitySummary extends MetricSummary {
  city: Nullable<string>;
}

export interface RiskScenarioSummary extends MetricSummary {
  scenario_id: string;
  weather: Nullable<string>;
  traffic_density: Nullable<string>;
  time_period: Nullable<string>;
  vehicle_type?: Nullable<string>;
  multiple_deliveries_group?: Nullable<string>;
  risk_score: number;
}

export interface DelayFactorFlow {
  source: string;
  target: string;
  level: number;
  order_count: number;
  avg_delivery_duration_min: number;
  delay_rate: number;
}

export interface TimeAnnotation {
  annotation_id: string;
  time_value: number;
  annotation_type: string;
  label: string;
  description: string;
  related_metric: string;
}

export interface Filters {
  city: string;
  weather: string;
  traffic: string;
  vehicle: string;
  timePeriod: string;
}
