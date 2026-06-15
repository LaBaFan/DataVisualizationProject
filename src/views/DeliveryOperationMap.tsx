import { MouseEvent, useEffect, useMemo, useState } from 'react';
import DeliveryFlowParticleLayer from '../components/DeliveryFlowParticleLayer';
import MapLegend from '../components/MapLegend';
import MapTooltip from '../components/MapTooltip';
import MiniMetricTagLayer from '../components/MiniMetricTagLayer';
import OrderDensityDotLayer from '../components/OrderDensityDotLayer';
import RiskHeatHaloLayer from '../components/RiskHeatHaloLayer';
import ViewContextHUD from '../components/ViewContextHUD';
import {
  loadOverviewSummary,
  loadTimePeriodSummary,
  loadWeatherImpactSummary,
  mockDeliveryFlowSegments,
  mockOrderDensityDots,
  mockRiskHeatHalos
} from '../api/staticDataClient';
import { miniMetricTags } from '../data/mapOverlayData';
import { useInteraction } from '../store/interactionContext';
import { MapSelection, OrderDot, OverviewSummary, TimePeriodSummary, ViewContextMetrics, WeatherImpactSummary } from '../types/data';

const CITY_MAP_SRC = '/assets/delivery_city_map.png';

export default function DeliveryOperationMap() {
  const [hoveredSelection, setHoveredSelection] = useState<MapSelection | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [overview, setOverview] = useState<OverviewSummary | null>(null);
  const [weatherSummary, setWeatherSummary] = useState<WeatherImpactSummary[]>([]);
  const [timePeriodSummary, setTimePeriodSummary] = useState<TimePeriodSummary[]>([]);
  const {
    selectedWeather,
    selectedTimePeriod,
    activeSection,
    selectedItem: selectedSelection,
    setSelectedItem,
    setSelectedOrderId
  } = useInteraction();

  const selectedKey = selectedSelection ? `${selectedSelection.type}:${selectedSelection.item.id}` : null;
  const hoveredKey = hoveredSelection ? `${hoveredSelection.type}:${hoveredSelection.item.id}` : null;

  const metricTags = useMemo(() => miniMetricTags.slice(0, 5), []);
  const riskHalos = useMemo(() => mockRiskHeatHalos.slice(0, 5), []);
  const orderDensityDots = useMemo(() => mockOrderDensityDots.slice(0, 54), []);
  const flowSegments = useMemo(() => mockDeliveryFlowSegments.slice(0, 14), []);
  const hudMetrics = useMemo(
    () => buildViewContextMetrics(orderDensityDots, selectedWeather, selectedTimePeriod, overview, weatherSummary, timePeriodSummary),
    [orderDensityDots, selectedWeather, selectedTimePeriod, overview, weatherSummary, timePeriodSummary]
  );

  useEffect(() => {
    let ignore = false;
    Promise.all([loadOverviewSummary(), loadWeatherImpactSummary(), loadTimePeriodSummary()]).then(
      ([overviewData, weatherData, timeData]) => {
        if (ignore) return;
        setOverview(overviewData);
        setWeatherSummary(weatherData);
        setTimePeriodSummary(timeData);
      }
    );
    return () => {
      ignore = true;
    };
  }, []);

  const handleHover = (selection: MapSelection, event: MouseEvent<SVGElement>) => {
    const stage = event.currentTarget.closest('.map-canvas');
    const rect = stage?.getBoundingClientRect();
    setHoveredSelection(selection);
    setTooltipPosition({
      x: rect ? event.clientX - rect.left : event.clientX,
      y: rect ? event.clientY - rect.top : event.clientY
    });
  };

  const handleSelect = (selection: MapSelection | null) => {
    setSelectedItem(selection);
    setSelectedOrderId(null);
    if (!selection) {
      setHoveredSelection(null);
    }
  };

  return (
    <div className="operation-map-page">
      <header className="map-header">
        <span className="map-brand">FoodETA</span>
        <p>{sceneCopy[activeSection]}</p>
      </header>

      <section className="map-stage" aria-label="外卖配送城市运行图">
        <div
          className={`map-canvas time-tone-${selectedTimePeriod} scene-${activeSection}`}
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              handleSelect(null);
            }
          }}
        >
          <img className="city-map-bg" src={CITY_MAP_SRC} alt="外卖配送城市运行图" draggable={false} />
          <RiskHeatHaloLayer
            halos={riskHalos}
            hoveredId={hoveredKey?.startsWith('risk_heat_halo:') ? hoveredKey.replace('risk_heat_halo:', '') : null}
            selectedId={selectedKey?.startsWith('risk_heat_halo:') ? selectedKey.replace('risk_heat_halo:', '') : null}
            selectedWeather={selectedWeather}
            selectedTimePeriod={selectedTimePeriod}
            activeScene={activeSection}
            onHover={(halo, event) => handleHover({ type: 'risk_heat_halo', item: halo }, event)}
            onLeave={() => setHoveredSelection(null)}
            onSelect={(halo) => handleSelect({ type: 'risk_heat_halo', item: halo })}
          />
          <OrderDensityDotLayer
            dots={orderDensityDots}
            hoveredId={hoveredKey?.startsWith('order_dot:') ? hoveredKey.replace('order_dot:', '') : null}
            selectedId={selectedKey?.startsWith('order_dot:') ? selectedKey.replace('order_dot:', '') : null}
            selectedWeather={selectedWeather}
            selectedTimePeriod={selectedTimePeriod}
            activeScene={activeSection}
            onHover={(dot, event) => handleHover({ type: 'order_dot', item: dot }, event)}
            onLeave={() => setHoveredSelection(null)}
            onSelect={(dot) => handleSelect({ type: 'order_dot', item: dot })}
          />
          <DeliveryFlowParticleLayer
            segments={flowSegments}
            hoveredId={hoveredKey?.startsWith('delivery_flow_segment:') ? hoveredKey.replace('delivery_flow_segment:', '') : null}
            selectedId={selectedKey?.startsWith('delivery_flow_segment:') ? selectedKey.replace('delivery_flow_segment:', '') : null}
            selectedWeather={selectedWeather}
            selectedTimePeriod={selectedTimePeriod}
            activeScene={activeSection}
            onHover={(segment, event) => handleHover({ type: 'delivery_flow_segment', item: segment }, event)}
            onLeave={() => setHoveredSelection(null)}
            onSelect={(segment) => handleSelect({ type: 'delivery_flow_segment', item: segment })}
          />
          <MiniMetricTagLayer
            tags={metricTags}
            hoveredId={hoveredKey?.startsWith('metric_tag:') ? hoveredKey.replace('metric_tag:', '') : null}
            selectedId={selectedKey?.startsWith('metric_tag:') ? selectedKey.replace('metric_tag:', '') : null}
            selectedWeather={selectedWeather}
            selectedTimePeriod={selectedTimePeriod}
            activeScene={activeSection}
            onHover={(tag, event) => handleHover({ type: 'metric_tag', item: tag }, event)}
            onLeave={() => setHoveredSelection(null)}
            onSelect={(tag) => handleSelect({ type: 'metric_tag', item: tag })}
          />
          <ViewContextHUD metrics={hudMetrics} />
          <MapLegend />
          <MapTooltip selection={hoveredSelection} x={tooltipPosition.x} y={tooltipPosition.y} />
        </div>
      </section>
    </div>
  );
}

const sceneCopy = {
  overview: '固定城市运行图叠加订单密度、风险热晕、配送流动和微型指标，点击任意对象查看 ETA Risk Ticket。',
  weather: '天气章节会增强当前天气相关对象，左侧天气筛选继续全局影响地图图层。',
  traffic: '交通章节不画长路线，只用高拥堵对象的热晕、订单点和标签定位压力。',
  time: '时间章节跟随顶部时段筛选切换地图 tone，高峰增强订单点和流动粒子。',
  risk: '风险章节强调高风险热晕与指标标签，点击风险对象仍可展开详情。',
  outlier: '异常订单章节突出延迟或偏离订单点，普通点退到背景。'
};

function matchesFilter(value: string | undefined, selectedValue: string) {
  return selectedValue === 'All' || !value || value === selectedValue;
}

function firstFiniteNumber(...values: Array<number | undefined>): number | undefined {
  return values.find((value) => typeof value === 'number' && Number.isFinite(value));
}

function normalizeRate(value: number | undefined): number | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value)) return undefined;
  if (value > 1) return value / 100;
  if (value < 0) return 0;
  return value;
}

function summarizeDots(dots: OrderDot[], selectedWeather: string, selectedTimePeriod: string) {
  const filtered = dots.filter((dot) => matchesFilter(dot.weather, selectedWeather) && matchesFilter(dot.time_period, selectedTimePeriod));
  const basis = filtered.length ? filtered : dots;
  const orderCount = basis.reduce((sum, dot) => sum + (dot.order_count ?? 1), 0);
  const durationWeight = basis.reduce((sum, dot) => sum + dot.delivery_duration_min * (dot.order_count ?? 1), 0);
  const delayWeight = basis.reduce((sum, dot) => sum + (normalizeRate(dot.delay_rate) ?? (dot.is_delayed ? 1 : 0)) * (dot.order_count ?? 1), 0);

  return {
    order_count: orderCount,
    avg_delivery_duration_min: orderCount > 0 ? durationWeight / orderCount : 0,
    delay_rate: orderCount > 0 ? delayWeight / orderCount : 0
  };
}

function averageFinite(...values: Array<number | undefined>) {
  const finite = values.filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
  if (!finite.length) return undefined;
  return finite.reduce((sum, value) => sum + value, 0) / finite.length;
}

function buildViewContextMetrics(
  dots: OrderDot[],
  selectedWeather: string,
  selectedTimePeriod: string,
  overview: OverviewSummary | null,
  weatherSummary: WeatherImpactSummary[],
  timePeriodSummary: TimePeriodSummary[]
): ViewContextMetrics {
  const dotSummary = summarizeDots(dots, selectedWeather, selectedTimePeriod);
  const overviewOrderCount = firstFiniteNumber(overview?.total_orders, overview?.valid_orders, overview?.order_count);
  const globalOrderCount = overviewOrderCount ?? dotSummary.order_count;
  const weatherRow = selectedWeather === 'All'
    ? undefined
    : weatherSummary.find((row) => row.weather === selectedWeather);
  const timeRow = selectedTimePeriod === 'All'
    ? undefined
    : timePeriodSummary.find((row) => row.time_period === selectedTimePeriod);

  let orderCount = dotSummary.order_count;
  let avgDeliveryDuration = dotSummary.avg_delivery_duration_min;
  let delayRate = dotSummary.delay_rate;

  if (selectedWeather === 'All' && selectedTimePeriod === 'All') {
    orderCount = globalOrderCount;
    avgDeliveryDuration = overview?.avg_delivery_duration_min ?? avgDeliveryDuration;
    delayRate = normalizeRate(overview?.delay_rate) ?? delayRate;
  } else if (weatherRow && timeRow) {
    orderCount = Math.max(1, Math.round((weatherRow.order_count * timeRow.order_count) / Math.max(globalOrderCount, 1)));
    avgDeliveryDuration = averageFinite(weatherRow.avg_delivery_duration_min, timeRow.avg_delivery_duration_min) ?? avgDeliveryDuration;
    delayRate = averageFinite(normalizeRate(weatherRow.delay_rate), normalizeRate(timeRow.delay_rate)) ?? delayRate;
  } else if (weatherRow) {
    orderCount = weatherRow.order_count;
    avgDeliveryDuration = weatherRow.avg_delivery_duration_min;
    delayRate = normalizeRate(weatherRow.delay_rate) ?? delayRate;
  } else if (timeRow) {
    orderCount = timeRow.order_count;
    avgDeliveryDuration = timeRow.avg_delivery_duration_min;
    delayRate = normalizeRate(timeRow.delay_rate) ?? delayRate;
  }

  return {
    weather: selectedWeather,
    time_period: selectedTimePeriod,
    order_count: Math.round(orderCount),
    avg_delivery_duration_min: avgDeliveryDuration,
    delay_threshold_min: overview?.delay_threshold_min ?? 45,
    delay_rate: delayRate
  };
}
