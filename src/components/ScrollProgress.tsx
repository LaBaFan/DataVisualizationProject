import { MouseEvent } from 'react';
import { useInteraction } from '../store/interactionContext';
import { ActiveSection } from '../types/data';

const sections: Array<{ id: ActiveSection; label: string; question: string }> = [
  { id: 'overview', label: 'Map', question: '配送运行风险在哪里出现？' },
  { id: 'weather', label: 'Weather', question: '哪些天气让 ETA 变慢？' },
  { id: 'traffic', label: 'Traffic', question: '哪些道路负载推高延迟？' },
  { id: 'time', label: 'Time', question: '一天中的订单压力如何变化？' },
  { id: 'risk', label: 'Risk', question: '哪些条件组合最高风险？' },
  { id: 'outlier', label: 'Orders', question: '哪些订单异常偏离？' }
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
