import DataOverviewPanel from '../components/DataOverviewPanel';
import InteractiveSceneMap from '../components/InteractiveSceneMap';
import SceneDetailPanel from '../components/SceneDetailPanel';
import SceneNavigation from '../components/SceneNavigation';

export default function FoodETAMapExplorer() {
  return (
    <div className="foodeta-explorer">
      <SceneNavigation />
      <div className="explorer-main">
        <InteractiveSceneMap />
        <SceneDetailPanel />
      </div>
      <DataOverviewPanel />
    </div>
  );
}
