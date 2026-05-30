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
- `courier_vehicle_summary.json`：骑手和车辆相关统计。
- `city_summary.json`：城市维度统计。
- `risk_scenario_summary.json`：配送风险场景排序结果。
- `delay_factor_flow.json`：延迟因素流向关系。
- `time_annotations.json`：时间趋势注释信息。

这些文件由脚本自动生成，不需要手工编辑。当前中期阶段已将处理后的 CSV 和 JSON 提交到仓库，便于课程检查和后续前端开发直接使用；若重新运行预处理脚本，相关文件会被覆盖更新。
