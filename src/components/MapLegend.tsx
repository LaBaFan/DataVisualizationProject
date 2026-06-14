import { useState } from 'react';

export default function MapLegend() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`compact-map-legend${collapsed ? ' is-collapsed' : ''}`} aria-label="地图数据图例">
      <button type="button" onClick={() => setCollapsed((value) => !value)}>
        {collapsed ? '图例' : '收起'}
      </button>
      {!collapsed ? (
        <div className="legend-content">
          <div>
            <span className="legend-dot legend-dot-small" />
            <span className="legend-dot legend-dot-large" />
            <span>点大小 = 订单量</span>
          </div>
          <div>
            <span className="legend-risk-color legend-risk-color-delay" />
            <span>红橙点 = 延迟订单</span>
          </div>
          <div>
            <span className="legend-risk-color legend-risk-color-normal" />
            <span>蓝绿点 = 正常订单</span>
          </div>
          <div>
            <span className="legend-halo" />
            <span>光晕 = 高风险区域</span>
          </div>
          <div>
            <span className="legend-particle" />
            <span>粒子 = 配送流动</span>
          </div>
        </div>
      ) : null}
    </aside>
  );
}
