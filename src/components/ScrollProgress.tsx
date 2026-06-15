import { MouseEvent } from 'react';
import { useInteraction } from '../store/interactionContext';
import { ActiveSection } from '../types/data';

const sections: Array<{ id: ActiveSection; label: string; question: string }> = [
  { id: 'overview', label: 'Overview', question: '当前城市配送系统中，哪些区域、道路或场景呈现较高延迟风险？' },
  { id: 'weather', label: 'Weather', question: '哪些天气会让 ETA 明显变慢？' },
  { id: 'traffic', label: 'Traffic', question: '交通拥堵程度从 Low 到 Jam 变化时，配送时长和延迟风险如何变化？' },
  { id: 'time', label: 'Time', question: '一天中订单压力和延迟风险如何变化？' },
  { id: 'risk', label: 'Risk', question: '哪些天气、交通、时段和车辆类型组合最容易导致延迟？' },
  { id: 'outlier', label: 'Orders', question: '哪些订单偏离正常距离-配送时长关系？' }
];

export default function ScrollProgress() {
  const { activeSection, navigateToSection } = useInteraction();

  const handleClick = (event: MouseEvent<HTMLAnchorElement>, section: ActiveSection) => {
    event.preventDefault();
    navigateToSection(section);
    document.getElementById(`section-${section}`)?.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });
  };

  return (
    <div className="scroll-progress" aria-label="Story progress">
      {sections.map((section) => (
        <a
          key={section.id}
          className={activeSection === section.id ? 'is-active' : ''}
          href={`#section-${section.id}`}
          title={section.question}
          onClick={(event) => handleClick(event, section.id)}
        >
          <span>{sections.indexOf(section) + 1}</span>
          {section.label}
        </a>
      ))}
    </div>
  );
}
