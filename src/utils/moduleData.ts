import {
  loadRiskScenarioSummary,
  loadScenarioDistanceTimePoints,
  loadSceneFilterSummary,
  loadWeatherImpactSummary
} from '../api/staticDataClient';
import {
  getSceneIdByModuleId,
  getWeatherByModuleId,
  WeatherModuleId
} from '../data/weatherModules';
import type {
  DistanceTimePoint,
  RiskScenario,
  SceneFilterSummary,
  WeatherImpactSummary
} from '../types/data';

type ModuleSummary = WeatherImpactSummary | SceneFilterSummary;

export function getModuleWeather(moduleId: WeatherModuleId | string) {
  return getWeatherByModuleId(moduleId);
}

export async function getWeatherSummary(moduleId: WeatherModuleId | string): Promise<ModuleSummary | null> {
  const weather = getModuleWeather(moduleId);
  const sceneId = getSceneIdByModuleId(moduleId);
  const [weatherRows, sceneRows] = await Promise.all([
    loadWeatherImpactSummary(),
    loadSceneFilterSummary()
  ]);

  if (weather !== 'All') {
    const weatherSummary = weatherRows.find((row) => row.weather === weather);
    if (weatherSummary) return weatherSummary;
  }

  return sceneRows.find((row) => row.scene_id === sceneId && row.weather === 'All' && row.time_period === 'All') ?? null;
}

export async function getModuleTrafficData(moduleId: WeatherModuleId | string): Promise<SceneFilterSummary[]> {
  const sceneId = getSceneIdByModuleId(moduleId);
  const rows = await loadSceneFilterSummary();
  return rows.filter((row) => row.scene_id === sceneId);
}

export async function getModuleRiskScenarios(moduleId: WeatherModuleId | string): Promise<RiskScenario[]> {
  const weather = getModuleWeather(moduleId);
  const rows = await loadRiskScenarioSummary();
  if (weather === 'All') return rows;
  return rows.filter((row) => row.weather === weather);
}

export async function getModuleOutlierOrders(moduleId: WeatherModuleId | string): Promise<DistanceTimePoint[]> {
  const weather = getModuleWeather(moduleId);
  const rows = await loadScenarioDistanceTimePoints();
  if (weather === 'All') return rows;
  return rows.filter((row) => row.weather === weather);
}
