# 处理后数据说明

本目录用于存放 `scripts/preprocess.py` 生成的清洗数据和聚合结果。

主要输出文件包括：

- `orders_clean.csv`：清洗后的订单级数据。
- `overview_summary.json`：总体概览指标。
- `delivery_time_distribution.json`：配送时长分布。
- `distance_time_sample.json`：距离与配送时长散点采样数据，最多 5000 条。
- `time_period_summary.json`：按时段聚合的统计结果。
- `hour_summary.json`：按小时聚合的统计结果。
- `weather_traffic_summary.json`：天气与交通组合统计。
- `weather_impact_summary.json`：按天气聚合的订单量、平均配送时长、延迟率和风险指标。
- `traffic_density_summary.json`：按 Low、Medium、High、Jam 聚合的交通压力分层统计。
- `courier_vehicle_summary.json`：骑手和车辆相关统计。
- `city_summary.json`：城市维度统计。
- `risk_scenario_summary.json`：配送风险场景排序结果。
- `scenario_orders_sample.json`：高风险场景代表订单样本。
- `scenario_distance_time_points.json`：按风险场景抽样的距离-配送时长散点。
- `scene_summary.json`：面向 Overall Map Explorer 的地图 scene 聚合指标；区域类 scene 是基于真实订单规则的业务 proxy，不是真实 GIS 区域。
- `scene_filter_summary.json`：按 scene、weather 和 time_period 交叉聚合的真实样本统计，用于模块切换后继续响应天气和时段筛选。
- `delay_factor_flow.json`：延迟因素流向关系。
- `time_annotations.json`：时间趋势注释信息。

这些文件由脚本自动生成，不需要手工编辑。当前阶段已将处理后的 CSV 和 JSON 提交到仓库，便于课程检查和前端开发直接使用；若重新运行 `scripts/preprocess.py`，上述清洗结果和聚合 JSON 会被自动覆盖更新。前端需要的 JSON 会再通过 `scripts/sync_public_data.py` 同步到 `public/data/`。
