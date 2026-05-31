import { useState } from 'react';
import DetailPanel from './components/DetailPanel';
import FilterPanel from './components/FilterPanel';
import AnnotatedTemporalView from './views/AnnotatedTemporalView';
import CityComparisonView from './views/CityComparisonView';
import CourierVehicleView from './views/CourierVehicleView';
import DelayFactorFlowView from './views/DelayFactorFlowView';
import DeliveryRiskRankingView from './views/DeliveryRiskRankingView';
import DeliveryTimeDistributionView from './views/DeliveryTimeDistributionView';
import DistanceTimeScatterView from './views/DistanceTimeScatterView';
import OverviewView from './views/OverviewView';
import TemporalPatternView from './views/TemporalPatternView';
import WeatherTrafficView from './views/WeatherTrafficView';
import { useFilters } from './store/filterContext';
import { VIEW_TABS, ViewId } from './utils/constants';

function renderView(activeView: ViewId) {
  switch (activeView) {
    case 'overview':
      return <OverviewView />;
    case 'distribution':
      return <DeliveryTimeDistributionView />;
    case 'scatter':
      return <DistanceTimeScatterView />;
    case 'temporal':
      return <TemporalPatternView />;
    case 'weather':
      return <WeatherTrafficView />;
    case 'courier':
      return <CourierVehicleView />;
    case 'city':
      return <CityComparisonView />;
    case 'risk':
      return <DeliveryRiskRankingView />;
    case 'flow':
      return <DelayFactorFlowView />;
    case 'annotated':
      return <AnnotatedTemporalView />;
    default:
      return <OverviewView />;
  }
}

export default function App() {
  const [activeView, setActiveView] = useState<ViewId>('overview');
  const { filters } = useFilters();
  const activeLabel = VIEW_TABS.find((tab) => tab.id === activeView)?.label ?? activeView;

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Data Visualization Project</p>
          <h1>FoodETA 外卖配送时效可视分析</h1>
          <p>基于 processed 聚合数据构建的纯前端单页 dashboard，支持多视图联动扩展。</p>
        </div>
      </header>
      <main className="dashboard-layout">
        <FilterPanel />
        <section className="workspace">
          <nav className="tab-bar" aria-label="FoodETA views">
            {VIEW_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={tab.id === activeView ? 'active' : ''}
                onClick={() => setActiveView(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </nav>
          {renderView(activeView)}
        </section>
        <DetailPanel activeView={activeLabel} filters={filters} />
      </main>
    </div>
  );
}
