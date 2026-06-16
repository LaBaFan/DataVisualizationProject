import DataOverviewPanel from '../components/DataOverviewPanel';
import SceneNavigation from '../components/SceneNavigation';
import WeatherModuleStage from '../sections/WeatherModuleStage';

export default function FoodETAMapExplorer() {
  return (
    <div className="foodeta-explorer">
      <SceneNavigation />
      <div className="explorer-main">
        <WeatherModuleStage />
      </div>
      <DataOverviewPanel />
    </div>
  );
}
