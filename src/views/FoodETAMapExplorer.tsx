import DataOverviewPanel from '../components/DataOverviewPanel';
import InteractiveSceneMap from '../components/InteractiveSceneMap';
import SceneNavigation from '../components/SceneNavigation';

export default function FoodETAMapExplorer() {
  return (
    <div className="foodeta-explorer">
      <SceneNavigation />
      <InteractiveSceneMap />
      <DataOverviewPanel />
    </div>
  );
}
