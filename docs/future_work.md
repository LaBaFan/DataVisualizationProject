# 后续工作计划

## 前端计划

后续前端计划采用 React + TypeScript + Vite。前端首要目标是加载 `data/processed/` 中的 CSV 和 JSON 文件，完成可交互的多视图可视分析界面。

计划视图包括：

- Overview：展示总订单数、平均配送时长、延迟率、平均距离等指标。
- Delivery Time Distribution：展示配送时长分布和长尾延迟。
- Distance-Time Scatter：展示距离与配送时长关系，并支持异常点查看。
- Temporal Pattern：展示小时和时段维度的订单量、平均时长和延迟率。
- Weather & Traffic：展示天气与交通组合对配送时效的影响。
- Courier & Vehicle：比较骑手属性、车辆类型和多单配送差异。
- City Summary：比较不同城市或区域的配送表现。
- Delivery Risk Ranking View：借鉴 LineUp 的多属性排序思想，展示不同条件组合的综合风险排序，支持按 `risk_score`、`delay_rate`、`avg_delivery_duration_min` 排序，并支持点击风险场景后联动其他视图。
- Delay Factor Flow View：借鉴 Parallel Sets 的多类别路径关系表达，展示 `weather`、`traffic_density`、`time_period`、`vehicle_type`、`multiple_deliveries`、`is_delayed` 之间的路径关系，用于分析多因素组合如何影响配送延迟。
- Annotated Temporal Pattern View：借鉴 TimeNotes 的时间注释思想，在时间趋势图中标注午高峰、晚高峰、订单量峰值、延迟率峰值等，帮助用户理解时间变化背后的业务语境。

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

## 后端计划

如果前端直接加载静态 JSON 能满足课程演示，可暂不引入后端。如果需要动态筛选、分页、抽样或更大规模数据查询，再使用 FastAPI 提供接口。

计划接口包括：

- `GET /api/overview`
- `GET /api/delivery-time-distribution`
- `GET /api/distance-time-sample`
- `GET /api/time-period-summary`
- `GET /api/weather-traffic-summary`
- `GET /api/courier-vehicle-summary`
- `GET /api/city-summary`

当前中期阶段不创建完整 React 或 FastAPI 项目，只保留数据处理脚本和文档，为后续实现提供输入数据和接口规划。

## 后续数据处理计划

为了支持 Delivery Risk Ranking View，后续计划增加 `risk_scenario_summary.json`。该文件按天气、交通、时段、车辆类型和多单配送等条件组合聚合配送风险场景，字段包括：

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

为了支持 Delay Factor Flow View，后续计划增加 `delay_factor_flow.json`，字段包括：

- `source`
- `target`
- `level`
- `order_count`
- `avg_delivery_duration_min`
- `delay_rate`

为了支持 Annotated Temporal Pattern View，后续计划增加 `time_annotations.json`，字段包括：

- `annotation_id`
- `time_value`
- `annotation_type`
- `label`
- `description`
- `related_metric`
