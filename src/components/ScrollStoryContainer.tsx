import { useEffect } from 'react';
import OperationOverviewSection from '../sections/OperationOverviewSection';
import OutlierOrdersSection from '../sections/OutlierOrdersSection';
import RiskScenarioSection from '../sections/RiskScenarioSection';
import TimeRhythmSection from '../sections/TimeRhythmSection';
import TrafficPressureSection from '../sections/TrafficPressureSection';
import WeatherImpactSection from '../sections/WeatherImpactSection';
import { useInteraction } from '../store/interactionContext';
import { ActiveSection } from '../types/data';

const sectionIds: ActiveSection[] = ['overview', 'weather', 'traffic', 'time', 'risk', 'outlier'];

export default function ScrollStoryContainer() {
  const { activeSection, setActiveSectionFromScroll } = useInteraction();

  useEffect(() => {
    const elements = sectionIds
      .map((id) => document.getElementById(`section-${id}`))
      .filter((element): element is HTMLElement => Boolean(element));

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => {
            const aTop = Math.abs(a.boundingClientRect.top);
            const bTop = Math.abs(b.boundingClientRect.top);
            return b.intersectionRatio - a.intersectionRatio || aTop - bTop;
          })[0];
        const id = visible?.target.getAttribute('data-section-id') as ActiveSection | null;
        if (id) setActiveSectionFromScroll(id);
      },
      { threshold: [0.48, 0.58, 0.68], rootMargin: '-30% 0px -42% 0px' }
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [setActiveSectionFromScroll]);

  useEffect(() => {
    sectionIds.forEach((id) => {
      document.getElementById(`section-${id}`)?.classList.toggle('is-active', id === activeSection);
    });
  }, [activeSection]);

  return (
    <main className="scroll-story-container">
      <OperationOverviewSection />
      <WeatherImpactSection />
      <TrafficPressureSection />
      <TimeRhythmSection />
      <RiskScenarioSection />
      <OutlierOrdersSection />
    </main>
  );
}
