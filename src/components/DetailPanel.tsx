import { Filters } from '../types/data';
import { FILTER_ALL } from '../utils/constants';

interface DetailPanelProps {
  activeView: string;
  filters: Filters;
}

export default function DetailPanel({ activeView, filters }: DetailPanelProps) {
  const activeFilters = Object.entries(filters).filter(([, value]) => value !== FILTER_ALL);

  return (
    <aside className="side-panel detail-panel">
      <div className="panel-heading">
        <h2>Details</h2>
      </div>
      <dl className="detail-list">
        <div>
          <dt>当前视图</dt>
          <dd>{activeView}</dd>
        </div>
        <div>
          <dt>筛选条件</dt>
          <dd>{activeFilters.length ? activeFilters.map(([key, value]) => `${key}: ${value}`).join(' / ') : '全部数据'}</dd>
        </div>
      </dl>
      <p className="panel-note">后续可在这里承载点击图元后的订单样本、风险场景解释和局部统计。</p>
    </aside>
  );
}
