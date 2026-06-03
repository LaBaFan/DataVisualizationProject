const references = [
  {
    name: 'LineUp',
    title: '多指标排序',
    text: '把订单量、延迟率、时长和风险评分放在同一配送调度语境中，帮助团队先看最该处理的路线组合。'
  },
  {
    name: 'Parallel Sets',
    title: '类别路径',
    text: '将天气、交通、时段、载具视作一条配送条件路径，适配运营、数据分析与调度协作。'
  },
  {
    name: 'TimeNotes',
    title: '时间注释',
    text: '用早餐、午高峰、晚高峰与夜间标签标注节奏变化，快速定位 ETA 异常时段。'
  }
];

export default function DesignReferenceCard() {
  return (
    <section className="design-reference">
      <div className="card-heading">
        <h2>可视分析参考 / Design References</h2>
        <p>LineUp、Parallel Sets 与 TimeNotes 被简化为首页的排序、路径理解与时段注释能力。</p>
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
