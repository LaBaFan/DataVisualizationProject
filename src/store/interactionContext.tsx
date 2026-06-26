import { createContext, ReactNode, useContext, useMemo, useRef, useState } from 'react';
import {
  getModuleIdBySceneId,
  getSceneIdByModuleId,
  getWeatherByModuleId,
  WeatherModuleId
} from '../data/weatherModules';
import { ActiveSection, MapSelection, WeatherComparisonContext } from '../types/data';

export type OverallFilter = 'all' | 'weather' | 'area';
export type ActiveModule = WeatherModuleId;
export type WeatherSubView = 'overview' | 'traffic' | 'time' | 'vehicle' | 'risk' | 'orders';

interface InteractionContextValue {
  activeModule: ActiveModule;
  selectedWeather: string;
  selectedTimePeriod: string;
  selectedTrafficDensity: string;
  selectedVehicleType: string;
  selectedSceneId: string;
  overallFilter: OverallFilter;
  activeSection: ActiveSection;
  selectedItem: MapSelection | null;
  selectedScenarioId: string | null;
  selectedOrderId: string | null;
  selectedSubView: WeatherSubView;
  programmaticSection: ActiveSection | null;
  weatherComparisonContext: WeatherComparisonContext | null;
  setActiveModule: (module: ActiveModule) => void;
  switchModule: (moduleId: ActiveModule) => void;
  setSelectedWeather: (weather: string) => void;
  setSelectedTimePeriod: (timePeriod: string) => void;
  setSelectedTrafficDensity: (trafficDensity: string) => void;
  setSelectedVehicleType: (vehicleType: string) => void;
  setSelectedSceneId: (sceneId: string) => void;
  setOverallFilter: (filter: OverallFilter) => void;
  setActiveSection: (section: ActiveSection) => void;
  setActiveSectionFromScroll: (section: ActiveSection) => void;
  navigateToSection: (section: ActiveSection) => void;
  setSelectedItem: (selection: MapSelection | null) => void;
  setSelectedScenarioId: (scenarioId: string | null) => void;
  setSelectedOrderId: (orderId: string | null) => void;
  setSelectedSubView: (subView: WeatherSubView) => void;
  setWeatherComparisonContext: (context: WeatherComparisonContext | null) => void;
  clearSelection: () => void;
}

const InteractionContext = createContext<InteractionContextValue | null>(null);

export function InteractionProvider({ children }: { children: ReactNode }) {
  const [activeModule, setActiveModuleState] = useState<ActiveModule>('overall');
  const [selectedWeather, setSelectedWeather] = useState('All');
  const [selectedTimePeriod, setSelectedTimePeriod] = useState('All');
  const [selectedTrafficDensity, setSelectedTrafficDensity] = useState('All');
  const [selectedVehicleType, setSelectedVehicleType] = useState('All');
  const [selectedSceneIdState, setSelectedSceneIdState] = useState('overall');
  const [overallFilterState, setOverallFilterState] = useState<OverallFilter>('all');
  const [activeSection, setActiveSectionState] = useState<ActiveSection>('overview');
  const [selectedItem, setSelectedItemState] = useState<MapSelection | null>(null);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedSubView, setSelectedSubView] = useState<WeatherSubView>('overview');
  const [programmaticSection, setProgrammaticSection] = useState<ActiveSection | null>(null);
  const [weatherComparisonContext, setWeatherComparisonContext] = useState<WeatherComparisonContext | null>(null);
  const programmaticTimer = useRef<number | null>(null);

  const setActiveSection = (section: ActiveSection) => {
    setActiveSectionState(section);
  };

  const setActiveSectionFromScroll = (section: ActiveSection) => {
    if (programmaticSection) return;
    setActiveSectionState(section);
  };

  const navigateToSection = (section: ActiveSection) => {
    setProgrammaticSection(section);
    setActiveSectionState(section);

    if (programmaticTimer.current) {
      window.clearTimeout(programmaticTimer.current);
    }

    programmaticTimer.current = window.setTimeout(() => {
      setProgrammaticSection(null);
      programmaticTimer.current = null;
    }, 560);
  };

  const setSelectedItem = (selection: MapSelection | null) => {
    setSelectedItemState(selection);
    if (!selection) {
      setSelectedScenarioId(null);
      setSelectedOrderId(null);
      return;
    }

    if ('scenario_id' in selection.item && selection.item.scenario_id) {
      setSelectedScenarioId(selection.item.scenario_id);
    }
    if (selection.type === 'order_dot') {
      setSelectedOrderId(selection.item.order_id ?? selection.item.id);
    }
  };

  const switchModule = (moduleId: ActiveModule) => {
    setActiveModuleState(moduleId);
    setSelectedWeather(getWeatherByModuleId(moduleId));
    setSelectedSceneIdState(getSceneIdByModuleId(moduleId));
    setOverallFilterState('all');
    setActiveSectionState(moduleId === 'overall' ? 'overview' : 'weather');
    setSelectedItemState(null);
    setSelectedScenarioId(null);
    setSelectedOrderId(null);
    setWeatherComparisonContext(null);
    setSelectedSubView('overview');
    setSelectedTrafficDensity('All');
    setSelectedVehicleType('All');
  };

  const setActiveModule = (moduleId: ActiveModule) => {
    switchModule(moduleId);
  };

  const setSelectedSceneId = (sceneId: string) => {
    setSelectedSceneIdState(sceneId);
    setActiveModuleState(getModuleIdBySceneId(sceneId));
    setSelectedItemState(null);
    setSelectedScenarioId(null);
    setSelectedOrderId(null);
    setWeatherComparisonContext(null);
    setSelectedSubView('overview');
    setSelectedTrafficDensity('All');
    setSelectedVehicleType('All');
  };

  const setOverallFilter = (filter: OverallFilter) => {
    setOverallFilterState(filter);
    setSelectedItemState(null);
    setSelectedScenarioId(null);
    setSelectedOrderId(null);
    setWeatherComparisonContext(null);
  };

  const value = useMemo<InteractionContextValue>(
    () => ({
      activeModule,
      selectedWeather,
      selectedTimePeriod,
      selectedTrafficDensity,
      selectedVehicleType,
      selectedSceneId: selectedSceneIdState,
      overallFilter: overallFilterState,
      activeSection,
      selectedItem,
      selectedScenarioId,
      selectedOrderId,
      selectedSubView,
      programmaticSection,
      weatherComparisonContext,
      setActiveModule,
      switchModule,
      setSelectedWeather,
      setSelectedTimePeriod,
      setSelectedTrafficDensity,
      setSelectedVehicleType,
      setSelectedSceneId,
      setOverallFilter,
      setActiveSection,
      setActiveSectionFromScroll,
      navigateToSection,
      setSelectedItem,
      setSelectedScenarioId,
      setSelectedOrderId,
      setSelectedSubView,
      setWeatherComparisonContext,
      clearSelection: () => setSelectedItem(null)
    }),
    [activeModule, selectedWeather, selectedTimePeriod, selectedTrafficDensity, selectedVehicleType, selectedSceneIdState, overallFilterState, activeSection, selectedItem, selectedScenarioId, selectedOrderId, selectedSubView, programmaticSection, weatherComparisonContext]
  );

  return <InteractionContext.Provider value={value}>{children}</InteractionContext.Provider>;
}

export function useInteraction() {
  const context = useContext(InteractionContext);
  if (!context) {
    throw new Error('useInteraction must be used within InteractionProvider');
  }
  return context;
}
