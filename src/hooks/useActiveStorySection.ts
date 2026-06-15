import { useEffect } from 'react';
import { useInteraction } from '../store/interactionContext';
import { ActiveSection } from '../types/data';

export const storySectionIds: ActiveSection[] = ['overview', 'weather', 'traffic', 'time', 'risk', 'outlier'];

export function useActiveStorySection() {
  const { setActiveSectionFromScroll } = useInteraction();

  useEffect(() => {
    let frameId = 0;
    let activeSection: ActiveSection | null = null;
    const elements = storySectionIds
      .map((id) => document.getElementById(`section-${id}`))
      .filter((element): element is HTMLElement => Boolean(element));

    if (!elements.length) return undefined;

    const updateActiveSection = () => {
      frameId = 0;
      const viewportCenter = window.innerHeight * 0.5;
      const closest = elements
        .map((element) => {
          const rect = element.getBoundingClientRect();
          const sectionCenter = rect.top + rect.height * 0.5;
          return {
            id: element.getAttribute('data-section-id') as ActiveSection,
            distance: Math.abs(sectionCenter - viewportCenter)
          };
        })
        .sort((a, b) => a.distance - b.distance)[0];

      if (closest?.id && closest.id !== activeSection) {
        activeSection = closest.id;
        setActiveSectionFromScroll(closest.id);
      }
    };

    const scheduleUpdate = () => {
      if (frameId) return;
      frameId = window.requestAnimationFrame(updateActiveSection);
    };

    updateActiveSection();
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate);

    return () => {
      if (frameId) window.cancelAnimationFrame(frameId);
      window.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
    };
  }, [setActiveSectionFromScroll]);
}
