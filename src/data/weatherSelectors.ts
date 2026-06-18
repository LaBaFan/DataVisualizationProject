import { loadDistanceTimeSample } from '../api/staticDataClient';
import {
  aggregateByTimePeriod,
  aggregateByTrafficDensity,
  aggregateByVehicleType,
  aggregateRiskScenarios,
  filterOrdersByTimePeriod,
  filterOrdersByWeather,
  getOrderScatterData,
  getOrderRiskScore,
  toSceneFilterSummary,
  toWeatherTrafficSummary,
  toWeatherVehicleSummary
} from '../sections/weather/weatherAnalytics';
import type {
  DistanceTimePoint,
  RiskScenario,
  SceneFilterSummary,
  WeatherOrderSample,
  WeatherTrafficSummary,
  WeatherVehicleSummary
} from '../types/data';

function toOrderSample(point: WeatherOrderSample): WeatherOrderSample {
  return {
    ...point,
    risk_visual_score: point.risk_visual_score ?? point.risk_score ?? 0
  };
}

async function loadWeatherOrders(weather: string, timePeriod = 'All'): Promise<DistanceTimePoint[]> {
  const orders = await loadDistanceTimeSample();
  return filterOrdersByTimePeriod(filterOrdersByWeather(orders, weather), timePeriod);
}

export async function getWeatherOrderSamples(weather: string, timePeriod = 'All'): Promise<WeatherOrderSample[]> {
  const rows = await loadWeatherOrders(weather, timePeriod);
  return getOrderScatterData(rows, 180).points.map(toOrderSample);
}

export async function getWeatherTrafficRows(weather: string): Promise<WeatherTrafficSummary[]> {
  const rows = await loadWeatherOrders(weather);
  return aggregateByTrafficDensity(rows).map((row) => toWeatherTrafficSummary(row));
}

export async function getWeatherTimeRows(weather: string): Promise<SceneFilterSummary[]> {
  const rows = await loadWeatherOrders(weather);
  return aggregateByTimePeriod(rows).map((row) => toSceneFilterSummary(row));
}

export async function getWeatherVehicleRows(weather: string): Promise<WeatherVehicleSummary[]> {
  const rows = await loadWeatherOrders(weather);
  return aggregateByVehicleType(rows).map((row) => toWeatherVehicleSummary(row));
}

export async function getWeatherRiskScenarios(weather: string): Promise<RiskScenario[]> {
  const rows = await loadWeatherOrders(weather);
  return aggregateRiskScenarios(rows);
}

export async function getWeatherOutlierOrders(weather: string): Promise<WeatherOrderSample[]> {
  const rows = await loadWeatherOrders(weather);
  return getOrderScatterData(rows, rows.length).points
    .filter((row) => row.is_delayed || getOrderRiskScore(row as unknown as DistanceTimePoint) >= 0.66)
    .sort((a, b) => (b.risk_score ?? 0) - (a.risk_score ?? 0) || b.delivery_duration_min - a.delivery_duration_min)
    .slice(0, 24);
}
