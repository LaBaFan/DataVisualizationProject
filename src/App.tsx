import TimeSelector from './components/TimeSelector';
import { InteractionProvider } from './store/interactionContext';
import FoodETAMapExplorer from './views/FoodETAMapExplorer';

export default function App() {
  return (
    <InteractionProvider>
      <div className="foodeta-story-shell">
        <TimeSelector />
        <FoodETAMapExplorer />
      </div>
    </InteractionProvider>
  );
}
