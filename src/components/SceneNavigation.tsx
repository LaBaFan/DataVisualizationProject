import type { CSSProperties } from 'react';
import { weatherModules } from '../data/weatherModules';
import { useInteraction } from '../store/interactionContext';

export default function SceneNavigation() {
  const { activeModule, switchModule } = useInteraction();

  return (
    <aside className="scene-sidebar" aria-label="Scene Navigation">
      <div className="rail-title">
        <span>Modules</span>
        <strong>天气入口</strong>
      </div>
      <nav className="scene-nav module-tabs" aria-label="FoodETA modules">
        {weatherModules.map((module) => (
          <button
            key={module.id}
            type="button"
            className={`module-tab-button${activeModule === module.id ? ' is-active' : ''}`}
            onClick={() => switchModule(module.id)}
            style={{ '--module-accent': module.accentColor } as CSSProperties}
          >
            <span>{module.id === 'overall' ? '总览地图' : module.label}</span>
            <small>{module.id === 'overall' ? 'Overall' : module.weather}</small>
          </button>
        ))}
      </nav>
    </aside>
  );
}
