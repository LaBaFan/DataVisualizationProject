const references = [
  {
    name: 'LineUp',
    title: '多指标排序',
    text: '将风险分、延迟率、订单量和时长放在同一决策语境中，支持从排名跳转到场景解释。'
  },
  {
    name: 'Parallel Sets',
    title: '类别路径',
    text: '天气、交通、时段、载具被视作配送风险路径，而不是孤立筛选项。'
  },
  {
    name: 'TimeNotes',
    title: '时间注释',
    text: '时段条带把峰值、延迟率和平均时长叠加展示，帮助定位午晚高峰异常。'
  }
];

export default function DesignReferenceCard() {
  return (
    <section className="design-reference">
      <div className="card-heading">
        <h2>设计借鉴</h2>
        <p>三个可视分析思路被压缩到首页入口与联动细节中。</p>
      </div>
      <div className="reference-list">
        {references.map((item) => (
          <article key={item.name}>
            <span>{item.name}</span>
            <strong>{item.title}</strong>
            <p>{item.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
