# 后续工作计划

## 前端计划

前端已采用 React + TypeScript + Vite 搭建单页 dashboard 骨架。当前版本默认加载 `data/processed/` 中的聚合 JSON，并预留 `/api/*` 请求路径，方便后续切换到 FastAPI。

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

## 后端计划

当前仓库已经加入最小 FastAPI 后端骨架，负责读取 `data/processed/` 下的聚合 JSON，并向前端提供稳定 API。后端现阶段不引入数据库、认证、动态查询或复杂业务逻辑，重点是保证课程演示期间接口可启动、可跨域、缺少数据文件时不崩溃。

已规划并暴露的接口包括：

- `GET /api/health`
- `GET /api/overview`
- `GET /api/delivery-time-distribution`
- `GET /api/distance-time-sample`
- `GET /api/time-period-summary`
- `GET /api/hour-summary`
- `GET /api/weather-traffic-summary`
- `GET /api/courier-vehicle-summary`
- `GET /api/city-summary`
- `GET /api/risk-scenario-summary`
- `GET /api/delay-factor-flow`
- `GET /api/time-annotations`

当前数据处理脚本已经生成 `risk_scenario_summary.json`、`delay_factor_flow.json` 和 `time_annotations.json`。如果这些文件被删除或尚未运行预处理，对应接口仍会返回 `data_available: false` 和空数组，保证前后端不会崩溃。

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
