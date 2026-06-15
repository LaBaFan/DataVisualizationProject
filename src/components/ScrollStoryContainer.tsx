import StoryChapter from './StoryChapter';
import { useActiveStorySection } from '../hooks/useActiveStorySection';
import { useInteraction } from '../store/interactionContext';
import DeliveryOperationMap from '../views/DeliveryOperationMap';

const chapters = [
  {
    id: 'overview',
    step: '01',
    title: 'Overview'
  },
  {
    id: 'weather',
    step: '02',
    title: 'Weather'
  },
  {
    id: 'traffic',
    step: '03',
    title: 'Traffic'
  },
  {
    id: 'time',
    step: '04',
    title: 'Time'
  },
  {
    id: 'risk',
    step: '05',
    title: 'Risk'
  },
  {
    id: 'outlier',
    step: '06',
    title: 'Orders'
  }
] as const;

export default function ScrollStoryContainer() {
  const { activeSection } = useInteraction();
  useActiveStorySection();

  return (
    <section className="scroll-story-container">
      <div className="pinned-operation-map">
        <DeliveryOperationMap />
      </div>
      <div className="story-chapter-track" aria-label="FoodETA scrollytelling chapters">
        {chapters.map((chapter) => (
          <StoryChapter
            key={chapter.id}
            id={chapter.id}
            step={chapter.step}
            title={chapter.title}
            active={activeSection === chapter.id}
          />
        ))}
      </div>
    </section>
  );
}
