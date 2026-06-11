import DataOverviewPanel from './components/DataOverviewPanel';
import ScrollProgress from './components/ScrollProgress';
import ScrollStoryContainer from './components/ScrollStoryContainer';
import TimeSelector from './components/TimeSelector';
import WeatherPanel from './components/WeatherPanel';
import { InteractionProvider } from './store/interactionContext';

export default function App() {
  return (
    <InteractionProvider>
      <div className="foodeta-story-shell">
        <TimeSelector />
        <div className="story-layout">
          <WeatherPanel />
          <div className="story-main">
            <ScrollProgress />
            <ScrollStoryContainer />
          </div>
          <DataOverviewPanel />
        </div>
      </div>
    </InteractionProvider>
  );
}
