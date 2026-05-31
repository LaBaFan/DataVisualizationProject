# 后续工作计划

## 前端计划

前端已采用 React + TypeScript + Vite 搭建单页 dashboard 骨架。当前版本直接加载 `data/processed/` 中的聚合 JSON。

计划视图包括：

- Overview：已展示总订单数、平均配送时长、延迟率、平均距离等指标，并加入小时趋势小图。
- Delivery Time Distribution：已展示配送时长分布和长尾延迟。
- Distance-Time Scatter：已展示距离与配送时长关系，后续补充 brushing 和异常点详情。
- Temporal Pattern：已展示小时维度的平均时长和延迟率，后续补充时段聚合联动。
- Weather & Traffic：已展示天气与交通组合对配送时效的影响。
- Courier & Vehicle：已展示车辆类型对配送表现的影响，后续补充骑手评分和多单配送联动。
- City Summary：已比较不同城市或区域的配送表现。
- Delivery Risk Ranking View：已有借鉴 LineUp 的可识别占位，并已接入 `risk_scenario_summary.json`；后续完善排序交互、权重调整和场景详情。
- Delay Factor Flow View：已有借鉴 Parallel Sets 的路径占位，并已接入 `delay_factor_flow.json`；后续完善 Sankey / Parallel Sets 式路径布局和颜色编码。
- Annotated Temporal Pattern View：已有借鉴 TimeNotes 的时间注释占位，并已接入 `time_annotations.json`；后续完善峰值标注、注释编辑和与小时趋势的联动。

## 可视化技术

后续计划使用 ECharts 和 D3。ECharts 适合快速实现柱状图、折线图、箱线图和热力图；D3 适合定制散点 brushing、联动状态和特殊布局。地图视图可根据时间选择 Leaflet 或 Mapbox GL JS，也可以先以城市对比视图替代地图实现。

## 多视图联动

后续交互重点包括：

- 时间、城市、天气、交通、车辆类型筛选。
- 距离-时间散点图 brushing。
- 点击图表元素后联动其他视图。
- 条件组合筛选与详情面板。
- details-on-demand：点击或框选后查看订单样本和局部统计。
- 延迟订单高亮。

## 经典设计借鉴与适配

后续系统会借鉴已有可视分析设计，但不会直接复用原系统，而是将其交互思想适配到外卖配送时效分析场景。

### Delivery Risk Ranking View：借鉴 LineUp

该部分用于支持 T7“高延迟风险场景排序与解释”。LineUp 的多属性排序思想适合展示和比较多个指标，因此 Delivery Risk Ranking View 将把天气、交通密度、时段、距离区间、车辆类型、多单配送等条件组合成配送风险场景。

每个场景展示 `order_count`、`avg_delivery_duration_min`、`delay_rate`、`avg_distance_km`、`multiple_delivery_rate`、`avg_rating` 和 `risk_score` 等指标。后续需要完善的功能包括风险评分说明、指标排序、权重调整、场景对比和点击后的详情面板。

### Delay Factor Flow View：借鉴 Parallel Sets / Sankey

该部分用于支持 T8“配送条件路径与延迟结果流向分析”。Parallel Sets 和 Sankey 适合表达多类别变量之间的路径关系，因此 Delay Factor Flow View 将展示 `weather -> traffic_density -> time_period -> is_delayed`、`vehicle_type -> multiple_deliveries -> is_delayed` 等路径。

路径宽度表示订单数量，颜色表示延迟率或平均配送时长。后续需要完善路径布局、颜色编码、路径高亮、条件筛选和路径详情，使用户能比较不同配送条件组合最终流向延迟或非延迟结果的比例差异。

### Annotated Temporal Pattern View：借鉴 TimeNotes

该部分用于增强时间模式解释。TimeNotes 的时间序列注释思想适合解释峰值、阶段和异常点，因此 Annotated Temporal Pattern View 将在小时趋势中标注午高峰、晚高峰、订单量峰值、平均配送时长峰值和延迟率峰值。

后续需要将 `time_annotations.json` 与前端时间趋势图联动，使趋势图不仅显示数值变化，也解释高峰和异常出现的业务语境。

## 静态数据加载计划

当前项目保持纯前端架构。前端通过 Vite 的静态 JSON 导入能力读取 `data/processed/` 下的聚合结果，不规划数据库、认证或动态查询服务。课程演示时只需要保证 processed JSON 已生成并提交，页面即可在本地开发服务器或构建产物中运行。

当前数据处理脚本已经生成 `risk_scenario_summary.json`、`delay_factor_flow.json` 和 `time_annotations.json`。如果某个 processed JSON 缺失，对应视图应显示空状态，而不是阻塞其他视图渲染。

## 后续数据处理计划

为了支持 Delivery Risk Ranking View，当前已经生成基础版 `risk_scenario_summary.json`。后续计划继续完善风险场景定义、权重配置和可解释排序说明。该文件按天气、交通、时段、车辆类型和多单配送等条件组合聚合配送风险场景，字段包括：

- `scenario_id`
- `weather`
- `traffic_density`
- `time_period`
- `vehicle_type`
- `multiple_deliveries_group`
- `order_count`
- `avg_delivery_duration_min`
- `delay_rate`
- `avg_distance_km`
- `multiple_delivery_rate`
- `avg_rating`
- `risk_score`

其中 `risk_score` 暂定为：

```text
risk_score =
0.4 * normalized_avg_delivery_duration
+ 0.3 * delay_rate
+ 0.2 * normalized_avg_distance
+ 0.1 * multiple_delivery_rate
```

该评分不是机器学习模型，而是用于可解释排序的可视分析指标，后续可根据课程反馈调整权重。

为了支持 Delay Factor Flow View，当前已经生成基础版 `delay_factor_flow.json`。后续计划补充更多可选路径和前端路径布局。字段包括：

- `source`
- `target`
- `level`
- `order_count`
- `avg_delivery_duration_min`
- `delay_rate`

为了支持 Annotated Temporal Pattern View，当前已经生成基础版 `time_annotations.json`。后续计划将注释与可视化峰值检测和业务时段说明进一步结合。字段包括：

- `annotation_id`
- `time_value`
- `annotation_type`
- `label`
- `description`
- `related_metric`
