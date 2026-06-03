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
            <span className="legend-line legend-line-low" />
            <span>线条颜色 = 交通压力</span>
          </div>
          <div>
            <span className="legend-dot legend-dot-small" />
            <span className="legend-dot legend-dot-large" />
            <span>点大小 = 订单量 / 时长</span>
          </div>
          <div>
            <span className="legend-risk-color" />
            <span>红橙 = 高延迟风险</span>
          </div>
          <div>
            <span className="legend-pulse" />
            <span>脉冲圈 = 高风险场景</span>
          </div>
        </div>
      ) : null}
    </aside>
  );
}
