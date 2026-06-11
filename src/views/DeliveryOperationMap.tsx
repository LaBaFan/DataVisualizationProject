import { MouseEvent, useMemo, useState } from 'react';
import ETARiskTicket from '../components/ETARiskTicket';
import MapLegend from '../components/MapLegend';
import MapInteractionLayer from '../components/MapInteractionLayer';
import MapTooltip from '../components/MapTooltip';
import MiniMetricTagLayer from '../components/MiniMetricTagLayer';
import OrderDotLayer from '../components/OrderDotLayer';
import RiskPulseLayer from '../components/RiskPulseLayer';
import ScenarioAnalysisDrawer from '../components/ScenarioAnalysisDrawer';
import TrafficOverlayLayer from '../components/TrafficOverlayLayer';
import { mapModules } from '../data/mapModules';
import { miniMetricTags, orderDots, scenarioAnchors, trafficSegments } from '../data/mapOverlayData';
import { useInteraction } from '../store/interactionContext';
import { MapModule, MapSelection, MiniMetricTag, OrderDot, ScenarioAnchor, TrafficSegment } from '../types/data';

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

  const modules = useMemo(() => mapModules, []);

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
        <p>点击建筑、道路、天气区域或配送场景，查看 ETA Risk Ticket。</p>
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
          <MapInteractionLayer
            modules={modules}
            hoveredId={hoveredKey?.startsWith('module:') ? hoveredKey.replace('module:', '') : null}
            selectedId={selectedKey?.startsWith('module:') ? selectedKey.replace('module:', '') : null}
            selectedWeather={selectedWeather}
            selectedTimePeriod={selectedTimePeriod}
            onHover={(module, event) => handleHover({ type: 'module', item: module }, event)}
            onLeave={() => setHoveredSelection(null)}
            onSelect={(module) => handleSelect(module ? { type: 'module', item: module } : null)}
          />
          <RiskPulseLayer
            anchors={scenarioAnchors}
            hoveredId={hoveredKey?.startsWith('risk_pulse:') ? hoveredKey.replace('risk_pulse:', '') : null}
            selectedId={selectedKey?.startsWith('risk_pulse:') ? selectedKey.replace('risk_pulse:', '') : null}
            selectedWeather={selectedWeather}
            selectedTimePeriod={selectedTimePeriod}
            onHover={(anchor, event) => handleHover({ type: 'risk_pulse', item: anchor }, event)}
            onLeave={() => setHoveredSelection(null)}
            onSelect={(anchor) => handleSelect({ type: 'risk_pulse', item: anchor })}
          />
          <TrafficOverlayLayer
            segments={trafficSegments}
            hoveredId={hoveredKey?.startsWith('traffic_segment:') ? hoveredKey.replace('traffic_segment:', '') : null}
            selectedId={selectedKey?.startsWith('traffic_segment:') ? selectedKey.replace('traffic_segment:', '') : null}
            selectedWeather={selectedWeather}
            selectedTimePeriod={selectedTimePeriod}
            onHover={(segment, event) => handleHover({ type: 'traffic_segment', item: segment }, event)}
            onLeave={() => setHoveredSelection(null)}
            onSelect={(segment) => handleSelect({ type: 'traffic_segment', item: segment })}
          />
          <OrderDotLayer
            dots={orderDots}
            hoveredId={hoveredKey?.startsWith('order_dot:') ? hoveredKey.replace('order_dot:', '') : null}
            selectedId={selectedKey?.startsWith('order_dot:') ? selectedKey.replace('order_dot:', '') : null}
            selectedWeather={selectedWeather}
            selectedTimePeriod={selectedTimePeriod}
            onHover={(dot, event) => handleHover({ type: 'order_dot', item: dot }, event)}
            onLeave={() => setHoveredSelection(null)}
            onSelect={(dot) => handleSelect({ type: 'order_dot', item: dot })}
          />
          <MiniMetricTagLayer
            tags={miniMetricTags}
            hoveredId={hoveredKey?.startsWith('metric_tag:') ? hoveredKey.replace('metric_tag:', '') : null}
            selectedId={selectedKey?.startsWith('metric_tag:') ? selectedKey.replace('metric_tag:', '') : null}
            selectedWeather={selectedWeather}
            selectedTimePeriod={selectedTimePeriod}
            onHover={(tag, event) => handleHover({ type: 'metric_tag', item: tag }, event)}
            onLeave={() => setHoveredSelection(null)}
            onSelect={(tag) => handleSelect({ type: 'metric_tag', item: tag })}
          />
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
          <MapLegend />
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

function selectionToMapModule(selection: MapSelection): MapModule | null {
  if (selection.type === 'module') return selection.item;
  if (selection.type === 'order_dot') return null;

  if (selection.type === 'traffic_segment') {
    const item: TrafficSegment = selection.item;
    return {
      id: item.id,
      type: 'road',
      label: item.label,
      description: '交通压力流量条，用于观察道路拥挤度对 ETA 和延迟率的影响。',
      shape: 'path',
      coords: item.path,
      traffic_density: item.traffic_density,
      order_count: item.order_count,
      avg_delivery_duration_min: item.avg_delivery_duration_min,
      delay_rate: item.delay_rate,
      risk_score: item.risk_score
    };
  }

  if (selection.type === 'risk_pulse') {
    const item: ScenarioAnchor = selection.item;
    return {
      id: item.id,
      type: 'risk_zone',
      label: item.label,
      description: '高风险脉冲圈，表示该区域的综合延迟风险评分较高。',
      shape: 'circle',
      coords: [item.x, item.y, item.radius],
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

  const item: MiniMetricTag = selection.item;
  return {
    id: item.id,
    type: 'risk_zone',
    label: item.label,
    description: '区域微型指标标签，用两个核心指标提示局部延迟风险。',
    shape: 'rect',
    coords: [item.x, item.y, 106, 42],
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
