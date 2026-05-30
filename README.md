# FoodETA：外卖配送时效与延迟因素可视分析

FoodETA 是“数据可视化导论”课程 project 的中期阶段成果。本项目基于 Kaggle 公开外卖配送时间数据，围绕配送时长、距离、天气、交通、时段、城市、骑手属性和车辆类型，设计一个后续可扩展为多视图可视分析系统的数据处理与分析方案。

当前阶段只完成数据理解、预处理脚本、分析任务定义和文档草稿；React 前端、FastAPI 后端、多视图联动和交互式可视化属于后续工作，尚未在本仓库中实现。

## 数据集来源

- 数据集：Food Delivery Dataset
- 来源：Kaggle
- 当前处理使用链接：https://www.kaggle.com/datasets/gauravmalik26/food-delivery-dataset
- 规模：公开资料显示约 45,000 条外卖配送记录，满足课程建议“不少于 1 万条记录”的数据规模要求。

原始 CSV 不提交到仓库。请下载数据后将 CSV 重命名为 `food_delivery.csv`，放置到：

```text
data/raw/food_delivery.csv
```

## 当前阶段目标

- 梳理 Food Delivery Dataset 数据字段和分析价值。
- 完成字段标准化、缺失值处理、配送时长解析、经纬度校验和配送距离计算。
- 生成订单级清洗数据和面向后续可视化的聚合 JSON。
- 明确 T1-T6 分析任务、初步图表设计和 case study 方向。
- 形成中期报告草稿和后续前后端实现计划。

## 字段说明

字段名会在预处理阶段统一为 snake_case。常见字段包括：

- 时间字段：`order_date`、`time_ordered`、`time_picked`、`delivery_duration_min`
- 空间字段：`restaurant_latitude`、`restaurant_longitude`、`delivery_latitude`、`delivery_longitude`
- 环境交通字段：`weather`、`traffic_density`、`festival`、`city`
- 订单字段：`order_type`、`vehicle_type`、`multiple_deliveries`
- 骑手字段：`delivery_person_id`、`delivery_person_age`、`delivery_person_ratings`

## 预处理流程

运行 `scripts/preprocess.py` 后，脚本会执行：

1. 读取 `data/raw/food_delivery.csv`。
2. 标准化字段名为 snake_case，并兼容常见空格、大小写差异和 NaN 字符串。
3. 从 `Time_taken(min)` 中提取配送时长数字，兼容 `(min) 24` 和 `24` 等格式。
4. 校验餐厅和配送位置经纬度，删除明显异常或缺失经纬度记录。
5. 使用 haversine 公式计算 `distance_km`。
6. 解析订单小时；若 `Time_Orderd` 缺失，则尝试 `Time_Order_picked`。
7. 根据 `Order_Date` 解析 `weekday`。
8. 生成时段、延迟标签、速度等派生字段。
9. 输出清洗 CSV 和多个聚合 JSON。

## 派生字段

- `delivery_duration_min`：配送时长，单位分钟。
- `distance_km`：餐厅到配送地点的球面距离，单位千米。
- `order_hour`：订单小时。
- `weekday`：订单日期对应星期。
- `time_period`：`breakfast`、`lunch_peak`、`afternoon`、`dinner_peak`、`night` 或 `unknown`。
- `is_delayed`：配送时长是否严格大于 75 分位数阈值。
- `speed_kmph`：配送速度，异常时置空。

时段规则：6-10 为 breakfast，10-14 为 lunch_peak，14-17 为 afternoon，17-21 为 dinner_peak，21-24 或 0-6 为 night，无法解析为 unknown。

## 生成文件

预处理完成后，`data/processed/` 会生成：

- `orders_clean.csv`
- `overview_summary.json`
- `delivery_time_distribution.json`
- `distance_time_sample.json`
- `time_period_summary.json`
- `hour_summary.json`
- `weather_traffic_summary.json`
- `courier_vehicle_summary.json`
- `city_summary.json`

## 安装依赖

建议使用 Python 3.10 或更高版本。

```bash
pip install -r requirements.txt
```

## 运行脚本

```bash
python scripts/preprocess.py
```

如果缺少 `data/raw/food_delivery.csv`，脚本会给出清晰错误提示并以非零状态退出。中期验收阶段不要求在没有真实 Kaggle CSV 的情况下运行预处理。

## 分析任务

- T1：分析配送时间整体分布。
- T2：探索配送距离与配送时间关系。
- T3：比较天气和交通状况对配送时效的影响。
- T4：分析不同时段的配送效率差异。
- T5：分析骑手属性与车辆类型对配送表现的影响。
- T6：识别高延迟风险场景组合。

详细定义见 `docs/analysis_tasks.md`。

## 设计参考与团队贡献

本项目后续可视化设计计划借鉴 LineUp、Parallel Sets 和 TimeNotes 的设计思想，但不会直接复用现有系统，而是结合外卖配送数据重新适配。

- LineUp：借鉴其多属性排序思想，设计 Delivery Risk Ranking View，将天气、交通密度、时段、距离、多单配送和骑手评分组合为“配送延迟风险场景”，并按 `risk_score`、延迟率或平均配送时长排序。
- Parallel Sets：借鉴其多类别路径关系表达，设计 Delay Factor Flow View，展示 `weather -> traffic_density -> time_period -> is_delayed` 等条件路径，分析多因素组合如何导向延迟。
- TimeNotes：借鉴其时间序列注释思想，设计 Annotated Temporal Pattern View，在小时趋势中标注午高峰、晚高峰、订单量峰值和延迟率峰值。

团队自己的设计贡献是围绕“外卖配送延迟风险场景识别”组织多视图分析流程，将单条订单数据提升为可解释的条件组合、路径关系和时段注释。

## 后续前后端计划

后续计划使用 React + TypeScript + Vite 实现前端界面，使用 ECharts 和 D3 构建多视图可视化；如需要动态筛选和更大数据量支持，再补充 FastAPI 服务层。当前仓库没有创建完整前端或后端目录。

计划接口包括：

- `GET /api/overview`
- `GET /api/delivery-time-distribution`
- `GET /api/distance-time-sample`
- `GET /api/time-period-summary`
- `GET /api/weather-traffic-summary`
- `GET /api/courier-vehicle-summary`
- `GET /api/city-summary`

## 三人分工

成员A：数据处理与字段解释。

- 下载 Kaggle 数据；
- 梳理字段含义；
- 编写 `preprocess.py`；
- 计算 `distance_km`、`time_period`、`is_delayed`、`speed_kmph`；
- 生成 processed 数据；
- 中期答辩中主讲数据来源和预处理流程。

成员B：分析任务与可视化设计。

- 明确分析任务；
- 设计后续视图；
- 说明每个视图对应的分析问题；
- 规划多视图联动；
- 中期答辩中主讲分析任务和可视化设计理由。

成员C：文档、系统规划与后续前后端设计。

- 整理 README；
- 编写 `midterm_report.tex`；
- 编写 `future_work.md`；
- 规划后续前端和后端架构；
- 中期答辩中主讲系统规划、分工和后续工作。

## AI 使用说明

本项目允许使用 AI 辅助字段整理、代码草稿生成、文档初稿撰写和表达润色。团队需要审查 AI 生成内容，确认字段解释、清洗规则、分析任务和可视化方案符合课程要求与实际数据。AI 不替代数据验证、设计决策和最终报告责任。

## TODO

- [x] 明确数据来源和字段分类。
- [x] 编写数据预处理脚本。
- [x] 编写距离计算和聚合输出工具。
- [x] 编写中期阶段文档草稿。
- [x] 下载并放置真实 Kaggle CSV。
- [x] 运行预处理并检查真实输出数据。
- [ ] 基于聚合 JSON 制作初步静态图表样例。
- [ ] 实现 React + TypeScript + Vite 前端。
- [ ] 根据数据规模决定是否加入 FastAPI 后端。
