import type { CSSProperties } from 'react';
import { weatherModules } from '../data/weatherModules';
import { useInteraction } from '../store/interactionContext';

const moduleTitle: Record<string, string> = {
  overall: '总览',
  sunny: '晴天',
  fog: '雾天',
  stormy: '雷暴',
  sandstorms: '沙尘',
  cloudy: '多云',
  windy: '大风'
};

export default function SceneNavigation() {
  const { activeModule, switchModule } = useInteraction();

  return (
    <aside className="scene-sidebar" aria-label="场景导航">
      <div className="rail-title">
        <span>FOODETA 目录</span>
        <strong>配送场景目录</strong>
      </div>
      <nav className="scene-nav module-tabs" aria-label="FoodETA 模块">
        {weatherModules.map((module, index) => (
          <button
            key={module.id}
            type="button"
            className={`module-tab-button${activeModule === module.id ? ' is-active' : ''}`}
            onClick={() => switchModule(module.id)}
            style={{ '--module-accent': module.accentColor } as CSSProperties}
          >
            <b>{String(index + 1).padStart(2, '0')}</b>
            <span>{moduleTitle[module.id] ?? module.label}</span>
            <small>{moduleTitle[module.id] ?? module.weather}</small>
          </button>
        ))}
      </nav>
    </aside>
  );
}
