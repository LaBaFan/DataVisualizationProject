import SectionTitle from '../components/SectionTitle';
import DeliveryOperationMap from '../views/DeliveryOperationMap';

export default function OperationOverviewSection() {
  return (
    <section id="section-overview" data-section-id="overview" className="story-section operation-overview-section">
      <SectionTitle eyebrow="Section 01" title="Operation Overview / 配送运行总览">
        背景图保留外卖配送城市语境，叠加轻量动态数据层，用于快速判断订单密度、风险热区和当前筛选下的运行变化。
      </SectionTitle>
      <DeliveryOperationMap />
    </section>
  );
}
