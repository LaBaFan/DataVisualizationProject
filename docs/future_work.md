# 后续工作计划

FoodETA 当前已经完成滚动式可视分析界面的交互框架：左侧 Weather Panel、顶部 Time Selector、右侧 Data Overview 和中间 6 个 scrollytelling section 已经可以联动。当前仍需补强的是数据生产链路。部分地图 overlay、Weather Ranking、Traffic Roads、Outlier Scatter 和 Scenario Drawer 使用前端 mock / overlay 配置，后续应由预处理脚本生成稳定的静态 JSON 替换。

## 数据输出规划

后续数据处理应继续保持纯前端静态数据架构：Python 预处理脚本生成 JSON，React 前端通过 `public/data/*.json` 读取，不引入后端、数据库或动态查询服务。

建议补充以下文件。

### `weather_impact_summary.json`

用于 Weather Impact section 和 Data Overview 的天气语境统计。

```json
[
  {
    "weather": "Fog",
    "order_count": 3200,
    "avg_delivery_duration_min": 41.2,
    "delay_rate": 0.68,
    "risk_score": 0.78
  }
]
```

该文件可替换当前天气排行中的 mock 数据。前端将使用 `weather` 作为筛选键，使用 `delay_rate` 作为排行条长度，使用 `avg_delivery_duration_min` 和 `order_count` 作为辅助解释指标。

### `traffic_segment_summary.json`

用于 Traffic Pressure section 和地图道路流量线段。

```json
[
  {
    "segment_id": "main_jam_road",
    "traffic_density": "Jam",
    "order_count": 5200,
    "avg_delivery_duration_min": 39.8,
    "delay_rate": 0.64,
    "risk_score": 0.81
  }
]
```

该文件可替换当前 `mapOverlayData.ts` 中的交通段配置。道路坐标仍可保留在前端配置中，统计字段由 JSON 覆盖：颜色映射 `traffic_density`，线宽映射 `order_count`，透明度或亮度映射 `delay_rate`。

### `scenario_orders_sample.json`

用于 ETA Risk Ticket、Scenario Analysis Drawer 和样例订单表。

```json
{
  "Cloudy|Jam|Night|Motorcycle": [
    {
      "order_id": "0x4607",
      "distance_km": 9.3,
      "delivery_duration_min": 45,
      "weather": "Cloudy",
      "traffic_density": "Jam",
      "vehicle_type": "motorcycle",
      "time_period": "night",
      "is_delayed": true,
      "delivery_person_ratings": 4.2
    }
  ]
}
```

该文件应按 `scenario_id` 分组保存代表订单。前端点击风险场景后，可以直接读取对应订单样本，替换当前 Drawer 中基于模块指标生成的 mock 订单。

### `scenario_distance_time_points.json`

用于 Outlier Orders section 和 Scenario Analysis Drawer 中的距离-配送时长散点图。

```json
{
  "Cloudy|Jam|Night|Motorcycle": [
    {
      "order_id": "0x4607",
      "distance_km": 9.3,
      "delivery_duration_min": 45,
      "is_delayed": true
    }
  ]
}
```

该文件应保留订单级散点数据，并可附带天气、交通、时段和车辆类型字段以支持筛选。前端使用 `distance_km` 作为横轴、`delivery_duration_min` 作为纵轴、`is_delayed` 作为颜色编码。

### `scenario_factor_summary.json`

用于 Risk Scenario Explain section 和 Scenario Analysis Drawer 的因素解释。

```json
{
  "Cloudy|Jam|Night|Motorcycle": [
    {
      "factor": "traffic_density",
      "value": "Jam",
      "avg_delivery_duration_min": 44.5,
      "delay_rate": 0.989,
      "description": "堵塞交通条件下配送延迟率较高。"
    },
    {
      "factor": "time_period",
      "value": "Night",
      "avg_delivery_duration_min": 43.2,
      "delay_rate": 0.81,
      "description": "夜间配送订单量较少，但延迟率偏高。"
    }
  ]
}
```

该文件用于把当前的解释文案从前端规则迁移到数据层。它不需要成为机器学习归因结果；课程项目阶段可以先采用可解释聚合指标，例如各条件下的平均时长、延迟率和相对全局平均的差值。

## 前端接入顺序

建议按风险和收益排序推进：

1. 接入 `weather_impact_summary.json`，替换 Weather Ranking 的 mock 数据。
2. 接入 `traffic_segment_summary.json`，让道路压力线段使用真实交通聚合指标。
3. 接入 `scenario_distance_time_points.json`，替换 Outlier Scatter 的 mock 散点。
4. 接入 `scenario_orders_sample.json`，让 Scenario Drawer 展示真实样例订单。
5. 接入 `scenario_factor_summary.json`，完善高风险场景解释和因素拆解。

每一步都应保留 mock fallback。若对应 JSON 缺失，页面继续使用当前前端 overlay 配置，避免课程演示时因数据文件缺失导致页面空白。

## 预处理脚本规划

当前不需要改变前端架构。后续可在 `scripts/preprocess.py` 或新增聚合脚本中补充以下输出逻辑：

- 按 `weather` 聚合订单量、平均配送时长、延迟率和风险评分，输出 `weather_impact_summary.json`。
- 按道路段或前端预定义 segment 映射聚合交通压力，输出 `traffic_segment_summary.json`。
- 按 `scenario_id` 抽样代表订单，输出 `scenario_orders_sample.json`。
- 按 `scenario_id` 抽样距离-时间散点，输出 `scenario_distance_time_points.json`。
- 按场景拆解天气、交通、时段、车辆类型等因素，输出 `scenario_factor_summary.json`。

这些输出完成后，FoodETA 的 scrollytelling 页面将从“已实现交互框架 + mock/overlay 数据”升级为“静态真实聚合数据驱动的可视分析系统”。
