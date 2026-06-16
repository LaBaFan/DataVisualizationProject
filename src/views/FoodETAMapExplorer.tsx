import DataOverviewPanel from '../components/DataOverviewPanel';
import SceneNavigation from '../components/SceneNavigation';
import { useInteraction } from '../store/interactionContext';
import WeatherModuleStage from '../sections/WeatherModuleStage';

export default function FoodETAMapExplorer() {
  const { activeModule } = useInteraction();

  return (
    <div className={`foodeta-explorer${activeModule === 'overall' ? ' is-overall-active' : ''}`}>
      <SceneNavigation />
      <div className="explorer-main">
        <WeatherModuleStage />
      </div>
      <DataOverviewPanel />
    </div>
  );
}
