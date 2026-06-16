import { createContext, ReactNode, useContext, useMemo, useRef, useState } from 'react';
import { ActiveSection, MapSelection } from '../types/data';

export type OverallFilter = 'all' | 'weather' | 'area';

interface InteractionContextValue {
  selectedWeather: string;
  selectedTimePeriod: string;
  selectedSceneId: string;
  overallFilter: OverallFilter;
  activeSection: ActiveSection;
  selectedItem: MapSelection | null;
  selectedScenarioId: string | null;
  selectedOrderId: string | null;
  programmaticSection: ActiveSection | null;
  setSelectedWeather: (weather: string) => void;
  setSelectedTimePeriod: (timePeriod: string) => void;
  setSelectedSceneId: (sceneId: string) => void;
  setOverallFilter: (filter: OverallFilter) => void;
  setActiveSection: (section: ActiveSection) => void;
  setActiveSectionFromScroll: (section: ActiveSection) => void;
  navigateToSection: (section: ActiveSection) => void;
  setSelectedItem: (selection: MapSelection | null) => void;
  setSelectedScenarioId: (scenarioId: string | null) => void;
  setSelectedOrderId: (orderId: string | null) => void;
  clearSelection: () => void;
}

const InteractionContext = createContext<InteractionContextValue | null>(null);

export function InteractionProvider({ children }: { children: ReactNode }) {
  const [selectedWeather, setSelectedWeather] = useState('All');
  const [selectedTimePeriod, setSelectedTimePeriod] = useState('All');
  const [selectedSceneIdState, setSelectedSceneIdState] = useState('overall');
  const [overallFilterState, setOverallFilterState] = useState<OverallFilter>('all');
  const [activeSection, setActiveSectionState] = useState<ActiveSection>('overview');
  const [selectedItem, setSelectedItemState] = useState<MapSelection | null>(null);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [programmaticSection, setProgrammaticSection] = useState<ActiveSection | null>(null);
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

  const setSelectedSceneId = (sceneId: string) => {
    setSelectedSceneIdState(sceneId);
    setSelectedItemState(null);
    setSelectedScenarioId(null);
    setSelectedOrderId(null);
  };

  const setOverallFilter = (filter: OverallFilter) => {
    setOverallFilterState(filter);
    setSelectedItemState(null);
    setSelectedScenarioId(null);
    setSelectedOrderId(null);
  };

  const value = useMemo<InteractionContextValue>(
    () => ({
      selectedWeather,
      selectedTimePeriod,
      selectedSceneId: selectedSceneIdState,
      overallFilter: overallFilterState,
      activeSection,
      selectedItem,
      selectedScenarioId,
      selectedOrderId,
      programmaticSection,
      setSelectedWeather,
      setSelectedTimePeriod,
      setSelectedSceneId,
      setOverallFilter,
      setActiveSection,
      setActiveSectionFromScroll,
      navigateToSection,
      setSelectedItem,
      setSelectedScenarioId,
      setSelectedOrderId,
      clearSelection: () => setSelectedItem(null)
    }),
    [selectedWeather, selectedTimePeriod, selectedSceneIdState, overallFilterState, activeSection, selectedItem, selectedScenarioId, selectedOrderId, programmaticSection]
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
