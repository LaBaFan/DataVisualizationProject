import { useEffect, useMemo, useState } from 'react';
import {
  loadOverviewSummary,
  loadRiskScenarioSummary,
  loadScenarioOrdersSample,
  loadTimePeriodSummary,
  loadWeatherTrafficSummary
} from './api/staticDataClient';
import DetailPanel, { DetailMode } from './components/DetailPanel';
import FilterPanel from './components/FilterPanel';
import RouteDecoration from './components/RouteDecoration';
import DesignReferenceCard from './views/DesignReferenceCard';
import DeliveryRiskMap from './views/DeliveryRiskMap';
import TemporalSummaryStrip from './views/TemporalSummaryStrip';
import WeatherTrafficMatrix from './views/WeatherTrafficMatrix';
import { useFilters } from './store/filterContext';
import { OverviewSummary, RiskScenario, ScenarioOrderSample, TimePeriodSummary, WeatherTrafficSummary } from './types/data';
import { FILTER_ALL } from './utils/constants';
import { formatNumber, formatPercent, labelOf } from './utils/format';

function matches(value: string | null | undefined, filter: string): boolean {
  return filter === FILTER_ALL || labelOf(value) === filter;
}

function matchesDelay(value: boolean | undefined, filter: string): boolean {
  return filter === FILTER_ALL || String(Boolean(value)) === filter;
}

function orderMatchesScenario(order: ScenarioOrderSample, scenario: RiskScenario): boolean {
  if (order.scenario_id && order.scenario_id === scenario.scenario_id) return true;
  return (
    labelOf(order.weather) === labelOf(scenario.weather) &&
    labelOf(order.traffic_density) === labelOf(scenario.traffic_density) &&
    labelOf(order.time_period) === labelOf(scenario.time_period) &&
    labelOf(order.vehicle_type) === labelOf(scenario.vehicle_type)
  );
}

function buildFallbackOrders(scenario: RiskScenario): ScenarioOrderSample[] {
  const baseDistance = scenario.avg_distance_km ?? Math.max(3, scenario.avg_delivery_duration_min / 5);
  const durationOffsets = [0, 4.5, -3.2];
  return durationOffsets.map((offset, index) => {
    const deliveryDuration = Math.max(8, scenario.avg_delivery_duration_min + offset);
    return {
      order_id: `fallback-${scenario.scenario_id}-${index + 1}`,
      scenario_id: scenario.scenario_id,
      weather: scenario.weather,
      traffic_density: scenario.traffic_density,
      vehicle_type: scenario.vehicle_type,
      time_period: scenario.time_period,
      distance_km: Math.max(1, baseDistance + index * 0.8),
      delivery_duration_min: deliveryDuration,
      predicted_duration_min: Math.max(5, deliveryDuration - scenario.delay_rate * 12),
      delay_minutes: scenario.delay_rate >= 0.2 ? Math.max(1, scenario.delay_rate * 18 + index) : 0,
      is_delayed: index === 0 ? scenario.delay_rate >= 0.2 : index === 1 ? scenario.delay_rate >= 0.35 : false,
      delivery_person_ratings: Math.max(3.5, 4.8 - scenario.risk_score * 0.7),
      multiple_deliveries: scenario.multiple_delivery_rate && scenario.multiple_delivery_rate > 0.25 ? 2 : 1
    };
  });
}

export default function App() {
  const { filters, patchFilters } = useFilters();
  const [overview, setOverview] = useState<OverviewSummary | null>(null);
  const [riskScenarios, setRiskScenarios] = useState<RiskScenario[]>([]);
  const [orders, setOrders] = useState<ScenarioOrderSample[]>([]);
  const [timePeriods, setTimePeriods] = useState<TimePeriodSummary[]>([]);
  const [weatherTraffic, setWeatherTraffic] = useState<WeatherTrafficSummary[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<RiskScenario | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<ScenarioOrderSample | null>(null);
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<TimePeriodSummary | null>(null);
  const [selectedMatrix, setSelectedMatrix] = useState<WeatherTrafficSummary | null>(null);
  const [detailMode, setDetailMode] = useState<DetailMode>('guide');

  const clearSelection = () => {
    setSelectedScenario(null);
    setSelectedOrder(null);
    setSelectedTimePeriod(null);
    setSelectedMatrix(null);
    setDetailMode('guide');
  };

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      loadOverviewSummary(),
      loadRiskScenarioSummary(),
      loadScenarioOrdersSample(),
      loadTimePeriodSummary(),
      loadWeatherTrafficSummary()
    ]).then(([overviewData, scenarioData, orderData, timeData, matrixData]) => {
      if (cancelled) return;
      setOverview(overviewData);
      setRiskScenarios(scenarioData);
      setOrders(orderData);
      setTimePeriods(timeData);
      setWeatherTraffic(matrixData);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredOrders = useMemo(
    () =>
      orders.filter(
        (order) =>
          matches(order.city, filters.city) &&
          matches(order.weather, filters.weather) &&
          matches(order.traffic_density, filters.traffic_density) &&
          matches(order.time_period, filters.time_period) &&
          matches(order.vehicle_type, filters.vehicle_type) &&
          matchesDelay(order.is_delayed, filters.is_delayed)
      ),
    [filters, orders]
  );

  const allowedScenarioIds = useMemo(() => {
    if (filters.city === FILTER_ALL && filters.is_delayed === FILTER_ALL) return null;
    return new Set(filteredOrders.map((order) => order.scenario_id).filter(Boolean));
  }, [filteredOrders, filters.city, filters.is_delayed]);

  const filteredScenarios = useMemo(
    () =>
      riskScenarios.filter(
        (scenario) =>
          matches(scenario.weather, filters.weather) &&
          matches(scenario.traffic_density, filters.traffic_density) &&
          matches(scenario.time_period, filters.time_period) &&
          matches(scenario.vehicle_type, filters.vehicle_type) &&
          (!allowedScenarioIds || allowedScenarioIds.has(scenario.scenario_id) || filteredOrders.some((order) => orderMatchesScenario(order, scenario)))
      ),
    [allowedScenarioIds, filteredOrders, filters, riskScenarios]
  );

  const filteredTimePeriods = useMemo(
    () => timePeriods.filter((period) => matches(period.time_period, filters.time_period)),
    [filters.time_period, timePeriods]
  );

  const filteredWeatherTraffic = useMemo(
    () =>
      weatherTraffic.filter(
        (item) => matches(item.weather, filters.weather) && matches(item.traffic_density, filters.traffic_density)
      ),
    [filters.traffic_density, filters.weather, weatherTraffic]
  );

  const scenarioOrders = useMemo(() => {
    if (!selectedScenario) return [];
    const candidates = filteredOrders.length ? filteredOrders : orders;
    const matchedOrders = candidates.filter((order) => orderMatchesScenario(order, selectedScenario));
    return matchedOrders.length ? matchedOrders : buildFallbackOrders(selectedScenario);
  }, [filteredOrders, orders, selectedScenario]);

  const metricItems = [
    { label: '总订单数', value: formatNumber(overview?.total_orders ?? overview?.order_count) },
    { label: '平均配送时长', value: `${formatNumber(overview?.avg_delivery_duration_min, 1)} min` },
    { label: '延迟率', value: formatPercent(overview?.delay_rate) },
    { label: '平均距离', value: `${formatNumber(overview?.avg_distance_km, 1)} km` }
  ];

  return (
    <div className="app-shell">
      <header className="app-header">
        <RouteDecoration />
        <div className="header-copy">
          <p className="eyebrow">ETA Risk Console</p>
          <h1>FoodETA</h1>
          <h2>外卖配送时效与延迟因素可视分析系统</h2>
          <p>从订单、天气、交通与骑手因素中识别高延迟配送场景。</p>
          <div className="header-tags">
            <span>Kaggle Food Delivery Dataset</span>
            <span>Static JSON Driven</span>
          </div>
        </div>
        <div className="header-metrics" aria-label="overview metrics">
          {metricItems.map((item) => (
            <div key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>
      </header>

      <main className="dashboard-layout">
        <FilterPanel scenarios={riskScenarios} orders={orders} onReset={clearSelection} />
        <section className="workspace">
          <DeliveryRiskMap
            scenarios={filteredScenarios}
            selectedScenarioId={selectedScenario?.scenario_id}
            onSelectScenario={(scenario) => {
              setSelectedScenario(scenario);
              setSelectedOrder(null);
              setSelectedTimePeriod(null);
              setSelectedMatrix(null);
              setDetailMode('scenario');
            }}
          />
          <div className="support-grid">
            <TemporalSummaryStrip
              periods={filteredTimePeriods}
              selectedTimePeriod={selectedTimePeriod?.time_period ?? undefined}
              onSelectTimePeriod={(summary) => {
                patchFilters({ time_period: labelOf(summary.time_period) });
                setSelectedTimePeriod(summary);
                setSelectedScenario(null);
                setSelectedOrder(null);
                setSelectedMatrix(null);
                setDetailMode('time');
              }}
            />
            <WeatherTrafficMatrix
              matrix={filteredWeatherTraffic}
              selectedWeather={selectedMatrix ? labelOf(selectedMatrix.weather) : undefined}
              selectedTraffic={selectedMatrix ? labelOf(selectedMatrix.traffic_density) : undefined}
              onSelectMatrix={(summary) => {
                patchFilters({
                  weather: labelOf(summary.weather),
                  traffic_density: labelOf(summary.traffic_density)
                });
                setSelectedMatrix(summary);
                setSelectedScenario(null);
                setSelectedOrder(null);
                setSelectedTimePeriod(null);
                setDetailMode('matrix');
              }}
            />
          </div>
          <DesignReferenceCard />
        </section>
        <DetailPanel
          filters={filters}
          mode={detailMode}
          selectedScenario={selectedScenario}
          selectedOrder={selectedOrder}
          selectedTimePeriod={selectedTimePeriod}
          selectedMatrix={selectedMatrix}
          overview={overview}
          scenarioOrders={scenarioOrders}
          onSelectOrder={(order) => {
            setSelectedOrder(order);
            setDetailMode('order');
          }}
        />
      </main>
    </div>
  );
}
