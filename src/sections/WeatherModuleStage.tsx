import { useInteraction } from '../store/interactionContext';
import OverallModule from './OverallModule';
import WeatherDetailModule from './WeatherDetailModule';

export default function WeatherModuleStage() {
  const { activeModule } = useInteraction();

  return (
    <main className="weather-module-stage">
      {activeModule === 'overall' ? <OverallModule /> : <WeatherDetailModule moduleId={activeModule} />}
    </main>
  );
}
