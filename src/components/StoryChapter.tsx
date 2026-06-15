import { ActiveSection } from '../types/data';

interface StoryChapterProps {
  id: ActiveSection;
  step: string;
  title: string;
  active?: boolean;
}

export default function StoryChapter({ id, step, title, active = false }: StoryChapterProps) {
  return (
    <section
      id={`section-${id}`}
      data-section-id={id}
      className={`story-chapter${active ? ' is-active' : ''}`}
      aria-current={active ? 'step' : undefined}
    >
      <span className="story-chapter-marker">{step} / {title}</span>
    </section>
  );
}
