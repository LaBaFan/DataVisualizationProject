import { MouseEvent } from 'react';
import { useInteraction } from '../store/interactionContext';
import { ActiveSection } from '../types/data';

const sections: Array<{ id: ActiveSection; label: string }> = [
  { id: 'overview', label: 'Map' },
  { id: 'weather', label: 'Weather' },
  { id: 'traffic', label: 'Traffic' },
  { id: 'time', label: 'Time' },
  { id: 'risk', label: 'Risk' },
  { id: 'outlier', label: 'Orders' }
];

export default function ScrollProgress() {
  const { activeSection, navigateToSection } = useInteraction();

  const handleClick = (event: MouseEvent<HTMLAnchorElement>, section: ActiveSection) => {
    event.preventDefault();
    navigateToSection(section);
    document.getElementById(`section-${section}`)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  };

  return (
    <div className="scroll-progress" aria-label="Story progress">
      {sections.map((section) => (
        <a
          key={section.id}
          className={activeSection === section.id ? 'is-active' : ''}
          href={`#section-${section.id}`}
          onClick={(event) => handleClick(event, section.id)}
        >
          <span />
          {section.label}
        </a>
      ))}
    </div>
  );
}
