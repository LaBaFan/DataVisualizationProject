import { MouseEvent, useMemo, useState } from 'react';
import DeliveryFlowParticleLayer from '../components/DeliveryFlowParticleLayer';
import ETARiskTicket from '../components/ETARiskTicket';
import MapLegend from '../components/MapLegend';
import MapTooltip from '../components/MapTooltip';
import MiniMetricTagLayer from '../components/MiniMetricTagLayer';
import OrderDensityDotLayer from '../components/OrderDensityDotLayer';
import RiskHeatHaloLayer from '../components/RiskHeatHaloLayer';
import ScenarioAnalysisDrawer from '../components/ScenarioAnalysisDrawer';
import ViewContextHUD from '../components/ViewContextHUD';
import { mockDeliveryFlowSegments, mockOrderDensityDots, mockRiskHeatHalos } from '../api/staticDataClient';
import { miniMetricTags } from '../data/mapOverlayData';
import { useInteraction } from '../store/interactionContext';
import { MapModule, MapSelection, MiniMetricTag, OrderDot, RiskHeatHalo, ViewContextMetrics } from '../types/data';

const CITY_MAP_SRC = '/assets/delivery_city_map.png';

export default function DeliveryOperationMap() {
  const [hoveredSelection, setHoveredSelection] = useState<MapSelection | null>(null);
  const [isAnalysisDrawerOpen, setIsAnalysisDrawerOpen] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const {
    selectedWeather,
    selectedTimePeriod,
    selectedItem: selectedSelection,
    selectedOrderId,
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
    () => buildViewContextMetrics(orderDensityDots, selectedWeather, selectedTimePeriod),
    [orderDensityDots, selectedWeather, selectedTimePeriod]
  );

  const analysisModule = selectedSelection ? selectionToMapModule(selectedSelection) : null;

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
    if (!selection && isAnalysisDrawerOpen) return;
    setSelectedItem(selection);
    setSelectedOrderId(null);
    if (!selection) {
      setHoveredSelection(null);
      setIsAnalysisDrawerOpen(false);
    }
  };

  const handleOpenAnalysis = () => {
    setSelectedOrderId(null);
    setIsAnalysisDrawerOpen(true);
  };

  return (
    <div className="operation-map-page">
      <header className="map-header">
        <span className="map-brand">FoodETA</span>
        <p>底图保留城市运行语境，叠加订单密度、风险热晕和轻量流动粒子，点击任意对象查看 ETA Risk Ticket。</p>
      </header>

      <main className="map-stage" aria-label="外卖配送城市运行图">
        <div
          className={`map-canvas time-tone-${selectedTimePeriod}`}
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
            onHover={(tag, event) => handleHover({ type: 'metric_tag', item: tag }, event)}
            onLeave={() => setHoveredSelection(null)}
            onSelect={(tag) => handleSelect({ type: 'metric_tag', item: tag })}
          />
          <ViewContextHUD metrics={hudMetrics} />
          <MapLegend />
          <MapTooltip selection={hoveredSelection} x={tooltipPosition.x} y={tooltipPosition.y} />
          <ETARiskTicket
            selection={selectedSelection}
            onClose={() => {
              setSelectedItem(null);
              setIsAnalysisDrawerOpen(false);
              setSelectedOrderId(null);
            }}
            onOpenAnalysis={analysisModule ? handleOpenAnalysis : undefined}
          />
          <ScenarioAnalysisDrawer
            module={analysisModule}
            open={isAnalysisDrawerOpen}
            selectedOrderId={selectedOrderId}
            onClose={() => setIsAnalysisDrawerOpen(false)}
            onSelectOrder={setSelectedOrderId}
          />
        </div>
      </main>
    </div>
  );
}

function matchesFilter(value: string | undefined, selectedValue: string) {
  return selectedValue === 'All' || !value || value === selectedValue;
}

function buildViewContextMetrics(dots: OrderDot[], selectedWeather: string, selectedTimePeriod: string): ViewContextMetrics {
  const filtered = dots.filter((dot) => matchesFilter(dot.weather, selectedWeather) && matchesFilter(dot.time_period, selectedTimePeriod));
  const basis = filtered.length ? filtered : dots;
  const orderCount = basis.reduce((sum, dot) => sum + (dot.order_count ?? 1), 0);
  const durationWeight = basis.reduce((sum, dot) => sum + dot.delivery_duration_min * (dot.order_count ?? 1), 0);
  const delayWeight = basis.reduce((sum, dot) => sum + (dot.delay_rate ?? (dot.is_delayed ? 1 : 0)) * (dot.order_count ?? 1), 0);

  return {
    weather: selectedWeather,
    time_period: selectedTimePeriod,
    order_count: orderCount,
    avg_delivery_duration_min: orderCount > 0 ? durationWeight / orderCount : 0,
    delay_threshold_min: 45,
    delay_rate: orderCount > 0 ? delayWeight / orderCount : 0
  };
}

function selectionToMapModule(selection: MapSelection): MapModule | null {
  if (selection.type === 'module') return selection.item;
  if (selection.type !== 'metric_tag' && selection.type !== 'risk_heat_halo') return null;

  const item: MiniMetricTag | RiskHeatHalo = selection.item;
  return {
    id: item.id,
    type: 'risk_zone',
    label: item.label,
    description: selection.type === 'risk_heat_halo' ? '高风险热晕区域，用半径和颜色提示局部订单压力与延迟风险。' : '区域微型指标标签，用两个核心指标提示局部延迟风险。',
    shape: 'rect',
    coords: selection.type === 'risk_heat_halo' ? [item.x, item.y, (item as RiskHeatHalo).radius] : [item.x, item.y, 106, 42],
    scenario_id: item.scenario_id,
    weather: item.weather,
    traffic_density: item.traffic_density,
    time_period: item.time_period,
    vehicle_type: item.vehicle_type,
    order_count: item.order_count,
    avg_delivery_duration_min: item.avg_delivery_duration_min,
    delay_rate: item.delay_rate,
    risk_score: item.risk_score
  };
}
