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

function isAll(value: string | null | undefined) {
  return !value || value === 'All';
}

export async function getWeatherSummary(moduleId: WeatherModuleId | string, timePeriod = 'All'): Promise<ModuleSummary | null> {
  const weather = getModuleWeather(moduleId);
  const sceneId = getSceneIdByModuleId(moduleId);
  const [weatherRows, sceneRows] = await Promise.all([
    loadWeatherImpactSummary(),
    loadSceneFilterSummary()
  ]);

  const selectedTimePeriod = isAll(timePeriod) ? 'All' : timePeriod;
  const sceneSummary =
    sceneRows.find((row) => row.scene_id === sceneId && row.weather === weather && row.time_period === selectedTimePeriod) ??
    sceneRows.find((row) => row.scene_id === sceneId && row.weather === 'All' && row.time_period === selectedTimePeriod) ??
    sceneRows.find((row) => row.scene_id === sceneId && row.weather === weather && row.time_period === 'All');

  if (sceneSummary) return sceneSummary;

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

export async function getModuleRiskScenarios(moduleId: WeatherModuleId | string, timePeriod = 'All'): Promise<RiskScenario[]> {
  const weather = getModuleWeather(moduleId);
  const rows = await loadRiskScenarioSummary();
  return rows.filter((row) => {
    const weatherMatches = weather === 'All' || row.weather === weather;
    const timeMatches = isAll(timePeriod) || row.time_period === timePeriod;
    return weatherMatches && timeMatches;
  });
}

export async function getModuleOutlierOrders(moduleId: WeatherModuleId | string, timePeriod = 'All'): Promise<DistanceTimePoint[]> {
  const weather = getModuleWeather(moduleId);
  const rows = await loadScenarioDistanceTimePoints();
  return rows.filter((row) => {
    const weatherMatches = weather === 'All' || row.weather === weather;
    const timeMatches = isAll(timePeriod) || row.time_period === timePeriod;
    return weatherMatches && timeMatches;
  });
}
