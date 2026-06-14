import { useEffect, useMemo, useState } from 'react';
import { loadRiskScenarioSummary } from '../api/staticDataClient';
import RiskScenarioBubblePlot from '../components/RiskScenarioBubblePlot';
import RiskScenarioDetailPanel from '../components/RiskScenarioDetailPanel';
import SectionTitle from '../components/SectionTitle';
import TopCriticalScenarios from '../components/TopCriticalScenarios';
import { useInteraction } from '../store/interactionContext';
import { MapSelection, RiskScenario } from '../types/data';

function normalizeRate(value: number | undefined) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  return value > 1 ? value / 100 : value;
}

function isMatchingFilter(row: RiskScenario, weather: string, timePeriod: string) {
  const weatherMatch = weather === 'All' || row.weather === weather;
  const timeMatch = timePeriod === 'All' || row.time_period === timePeriod;
  return weatherMatch && timeMatch;
}

function scenarioSelection(row: RiskScenario): MapSelection {
  return {
    type: 'module',
    item: {
      id: row.scenario_id,
      type: 'risk_zone',
      label: row.label,
      shape: 'circle',
      coords: [0, 0, 0],
      scenario_id: row.scenario_id,
      weather: row.weather ?? undefined,
      traffic_density: row.traffic_density ?? undefined,
      time_period: row.time_period ?? undefined,
      vehicle_type: row.vehicle_type ?? undefined,
      order_count: row.order_count,
      avg_delivery_duration_min: row.avg_delivery_duration_min,
      delay_rate: row.delay_rate,
      avg_distance_km: row.avg_distance_km,
      risk_score: row.risk_score
    }
  };
}

export default function RiskScenarioSection() {
  const {
    selectedWeather,
    selectedTimePeriod,
    selectedScenarioId,
    selectedItem,
    setSelectedItem,
    setSelectedScenarioId
  } = useInteraction();
  const [rows, setRows] = useState<RiskScenario[]>([]);

  useEffect(() => {
    loadRiskScenarioSummary().then(setRows);
  }, []);

  const rankedRows = useMemo(
    () =>
      rows
        .slice()
        .map((row) => ({
          ...row,
          delay_rate: normalizeRate(row.delay_rate),
          highlighted: isMatchingFilter(row, selectedWeather, selectedTimePeriod)
        }))
        .sort((a, b) => (b.risk_score ?? 0) - (a.risk_score ?? 0)),
    [rows, selectedTimePeriod, selectedWeather]
  );

  const selectedScenario = useMemo(
    () => rankedRows.find((row) => row.scenario_id === selectedScenarioId) ?? null,
    [rankedRows, selectedScenarioId]
  );
  const fallbackScenario = rankedRows[0] ?? null;
  const bubbleScenarios = useMemo(() => {
    const matching = rankedRows.filter((row) => row.highlighted);
    const selectedPool = matching.length ? matching : rankedRows;
    const topMatching = selectedPool.slice(0, 14);
    const filler = rankedRows
      .filter((row) => !topMatching.some((item) => item.scenario_id === row.scenario_id))
      .slice(0, Math.max(0, 18 - topMatching.length));

    return [...topMatching, ...filler];
  }, [rankedRows]);

  const handleSelectScenario = (scenario: RiskScenario) => {
    setSelectedItem(scenarioSelection(scenario));
    setSelectedScenarioId(scenario.scenario_id);
  };

  return (
    <section id="section-risk" data-section-id="risk" className="story-section risk-scenario-section">
      <SectionTitle eyebrow="Section 05" title="High Risk Scenarios / 高风险场景">
        用气泡图查看天气、交通、时段和车辆类型如何叠加成延迟风险。底部只保留 Top 5 关键组合，支持快速点选。
      </SectionTitle>
      <div className="story-panel risk-scenario-workbench">
        <div className="risk-scenario-main">
          <RiskScenarioBubblePlot
            scenarios={bubbleScenarios}
            selectedScenarioId={selectedScenarioId}
            onSelectScenario={handleSelectScenario}
          />
        </div>
        <RiskScenarioDetailPanel
          scenario={selectedScenario}
          fallbackScenario={fallbackScenario}
          selected={Boolean(selectedItem && 'scenario_id' in selectedItem.item)}
        />
      </div>
      <TopCriticalScenarios
        scenarios={rankedRows}
        selectedScenarioId={selectedScenarioId}
        onSelectScenario={handleSelectScenario}
      />
    </section>
  );
}
