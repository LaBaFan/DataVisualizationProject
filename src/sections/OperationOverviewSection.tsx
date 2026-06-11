import SectionTitle from '../components/SectionTitle';
import DeliveryOperationMap from '../views/DeliveryOperationMap';

export default function OperationOverviewSection() {
  return (
    <section id="section-overview" data-section-id="overview" className="story-section operation-overview-section">
      <SectionTitle eyebrow="Section 01" title="Operation Overview / 配送运行总览">
        背景图、交互热区、交通压力线段、订单密度点和风险脉冲共同构成风险发现入口。
      </SectionTitle>
      <DeliveryOperationMap />
    </section>
  );
}
