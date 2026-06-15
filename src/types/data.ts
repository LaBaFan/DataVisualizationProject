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
  total_orders?: number;
  valid_orders?: number;
  order_count?: number;
  avg_delivery_duration_min?: number;
  median_delivery_duration_min?: number;
  p75_delivery_duration_min?: number;
  min_delivery_duration_min?: number;
  max_delivery_duration_min?: number;
  delay_threshold_min?: number;
  delay_rate?: number;
  avg_distance_km?: number;
  median_distance_km?: number;
  avg_speed_kmph?: number;
  city_count?: number;
  weather_categories?: number;
  traffic_density_categories?: number;
  vehicle_type_categories?: number;
  time_period_categories?: number;
  delayed_orders?: number;
  on_time_orders?: number;
  high_risk_scenario_count?: number;
  generated_at?: string;
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
  scenario_id?: string;
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
  risk_score?: number;
}

export interface WeatherImpactSummary extends MetricSummary {
  weather: Nullable<string>;
  risk_score?: number;
}

export interface TrafficSegmentSummary extends MetricSummary {
  segment_id: string;
  label?: string;
  traffic_density: Nullable<string>;
  risk_score?: number;
}

export interface TrafficDensitySummary extends MetricSummary {
  traffic_density: 'Low' | 'Medium' | 'High' | 'Jam';
  risk_score: number;
  avg_distance_km?: number;
  label?: string;
}

export interface CourierVehicleSummary {
  by_vehicle_type: Array<MetricSummary & { vehicle_type: Nullable<string> }>;
  by_rating_bin: Array<MetricSummary & { rating_bin: Nullable<string> }>;
  by_age_bin: Array<MetricSummary & { age_bin: Nullable<string> }>;
}

export interface CitySummary extends MetricSummary {
  city: Nullable<string>;
}

export interface RiskScenario extends MetricSummary {
  scenario_id: string;
  label: string;
  weather?: Nullable<string>;
  traffic_density?: Nullable<string>;
  time_period?: Nullable<string>;
  vehicle_type?: Nullable<string>;
  multiple_deliveries_group?: Nullable<string>;
  multiple_delivery_rate?: number;
  avg_rating?: number;
  risk_score: number;
}

export interface RiskScenarioSummary extends Omit<RiskScenario, 'label'> {
  label?: string;
}

export interface ScenarioOrderSample {
  order_id: string;
  scenario_id?: string;
  city?: Nullable<string>;
  weather?: Nullable<string>;
  traffic_density?: Nullable<string>;
  time_period?: Nullable<string>;
  vehicle_type?: Nullable<string>;
  distance_km: number;
  delivery_duration_min: number;
  predicted_duration_min?: Nullable<number>;
  delay_minutes?: Nullable<number>;
  is_delayed?: boolean;
  delivery_person_ratings?: Nullable<number>;
  multiple_deliveries?: Nullable<number>;
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
  traffic_density: string;
  time_period: string;
  vehicle_type: string;
  is_delayed: string;
  traffic: string;
  vehicle: string;
  timePeriod: string;
}

export type MapModuleType =
  | 'restaurant'
  | 'building'
  | 'road'
  | 'weather'
  | 'risk_zone'
  | 'customer_area'
  | 'order_point'
  | 'rider';

export interface MapModule {
  id: string;
  type: MapModuleType;
  label: string;
  description?: string;
  shape: 'rect' | 'polygon' | 'circle' | 'path';
  coords: number[] | string;
  scenario_id?: string;
  weather?: string;
  traffic_density?: string;
  time_period?: string;
  vehicle_type?: string;
  order_count?: number;
  avg_delivery_duration_min?: number;
  delay_rate?: number;
  avg_distance_km?: number;
  risk_score?: number;
}

export interface ScenarioOrderPoint {
  order_id: string;
  distance_km: number;
  delivery_duration_min: number;
  is_delayed: boolean;
  weather?: string;
  traffic_density?: string;
  vehicle_type?: string;
  time_period?: string;
  delivery_person_ratings?: number;
}

export interface TrafficSegment {
  id: string;
  label: string;
  path: string;
  points: Array<[number, number]>;
  x?: number;
  y?: number;
  node_kind?: 'intersection' | 'merge' | 'customer_gate' | 'restaurant_gate' | 'weather_edge';
  traffic_density: 'Low' | 'Medium' | 'High' | 'Jam' | 'Unknown';
  order_count: number;
  avg_delivery_duration_min: number;
  avg_distance_km?: number;
  delay_rate: number;
  risk_score: number;
}

export interface OrderDot {
  id: string;
  x: number;
  y: number;
  order_count?: number;
  order_id?: string;
  distance_km?: number;
  delivery_duration_min: number;
  delay_rate?: number;
  risk_score?: number;
  is_delayed?: boolean;
  weather?: string;
  traffic_density?: string;
  time_period?: string;
  vehicle_type?: string;
}

export interface RiskHeatHalo {
  id: string;
  label: string;
  x: number;
  y: number;
  radius: number;
  order_count: number;
  avg_delivery_duration_min?: number;
  delay_rate: number;
  risk_score: number;
  weather?: string;
  traffic_density?: string;
  time_period?: string;
  vehicle_type?: string;
  scenario_id?: string;
}

export interface DeliveryFlowSegment {
  id: string;
  label: string;
  start: [number, number];
  end: [number, number];
  order_count?: number;
  avg_delivery_duration_min?: number;
  delay_rate: number;
  risk_score?: number;
  speed: number;
  weather?: string;
  traffic_density?: string;
  time_period?: string;
  vehicle_type?: string;
}

export interface ViewContextMetrics {
  weather: string;
  time_period: string;
  order_count: number;
  avg_delivery_duration_min: number;
  delay_threshold_min: number;
  delay_rate: number;
  risk_score?: number;
  avg_distance_km?: number;
}

export interface ScenarioAnchor {
  id: string;
  scenario_id?: string;
  label: string;
  x: number;
  y: number;
  radius: number;
  order_count: number;
  avg_delivery_duration_min: number;
  delay_rate: number;
  risk_score: number;
  weather?: string;
  traffic_density?: string;
  time_period?: string;
  vehicle_type?: string;
}

export interface MiniMetricTag {
  id: string;
  label: string;
  x: number;
  y: number;
  delay_rate?: number;
  avg_delivery_duration_min?: number;
  order_count?: number;
  risk_score?: number;
  scenario_id?: string;
  weather?: string;
  traffic_density?: string;
  time_period?: string;
  vehicle_type?: string;
}

export type MapSceneType = 'overall' | 'weather' | 'traffic' | 'time' | 'risk' | 'area';

export interface MapSceneMetric {
  label: string;
  value: string;
}

export interface MapSceneSummary {
  order_count: number;
  avg_delivery_duration_min: number;
  delay_rate: number;
  risk_score?: number;
  avg_distance_km?: number;
  delay_threshold_min?: number;
  source_filter?: string;
  description?: string;
}

export interface SceneFilterSummary extends MapSceneSummary {
  scene_id: string;
  weather: Nullable<string>;
  time_period: Nullable<string>;
}

export interface MapScene {
  id: string;
  type: MapSceneType;
  title: string;
  question: string;
  description: string;
  image: string;
  metrics: MapSceneMetric[];
  relatedWeather?: string;
  relatedTimePeriod?: string;
  summary?: MapSceneSummary;
}

export type SceneHotspotShape = 'polygon' | 'rect' | 'circle';

export interface SceneHotspot {
  id: string;
  targetSceneId: string;
  label: string;
  type: SceneHotspotShape;
  coords: number[];
  description?: string;
  order_count?: number;
  avg_delivery_duration_min?: number;
  delay_rate?: number;
  risk_score?: number;
  weather?: string;
  traffic_density?: string;
  time_period?: string;
}

export type MapSelection =
  | { type: 'module'; item: MapModule }
  | { type: 'traffic_segment'; item: TrafficSegment }
  | { type: 'order_dot'; item: OrderDot }
  | { type: 'risk_pulse'; item: ScenarioAnchor }
  | { type: 'metric_tag'; item: MiniMetricTag }
  | { type: 'risk_heat_halo'; item: RiskHeatHalo }
  | { type: 'delivery_flow_segment'; item: DeliveryFlowSegment }
  | { type: 'scene_hotspot'; item: SceneHotspot };

export type ActiveSection = 'overview' | 'weather' | 'traffic' | 'time' | 'risk' | 'outlier';
