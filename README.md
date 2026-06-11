# FoodETA 外卖配送时效可视分析

FoodETA 是一个用于“数据可视化导论”课程 project 的外卖配送数据可视分析系统。项目基于 Kaggle Food Delivery Dataset，围绕配送时长、配送距离、天气、交通、时段、城市、骑手属性和车辆类型，构建可运行的纯前端 React 应用。

当前主页调整为 **滚动式 Delivery Operation Map 可视分析界面**：页面不再是传统 dashboard、卡片墙、treemap 或天气交通矩阵，而是由固定控制区和滚动分析区组成。左侧是 Weather Panel，顶部是 Time Selector，右侧是 Data Overview，中间主区域通过 6 个滚动 section 组织外卖配送风险分析。

## 功能概览

- Sticky Time Selector：顶部固定展示 All、Morning、Noon、Afternoon、Evening、Night 等时间筛选。
- Sticky Weather Panel：左侧固定展示 All、Sunny、Fog、Cloudy、Stormy、Sandstorms、Windy、Unknown 等天气筛选。
- Sticky Data Overview：右侧根据当前滚动 section、天气筛选、时间筛选和选中对象展示最多 5 个关键指标与解释。
- Scrollytelling Sections：中间滚动区域包含 6 个分析 section，依次为配送运行总览、天气影响、交通压力、时间节奏、高风险场景解释和异常订单。
- Delivery Operation Map：第一屏主体使用 `/assets/delivery_city_map.png` 作为宽幅城市运行图背景。
- SVG 交互层：`src/data/mapModules.ts` 集中维护模块坐标，页面按 `1600 x 1000` viewBox 渲染透明热区；坐标需要微调时只改该文件。
- 轻量数据 Overlay：`src/data/mapOverlayData.ts` 集中维护交通压力线段、订单密度点、高风险脉冲圈和微型指标标签，让背景图体现交通拥挤度、订单压力、延迟率和风险评分等可视化映射。
- 筛选驱动变化：点击天气会高亮地图中的相关天气区域、订单点、风险脉冲和微型标签，并降低不相关图层透明度；点击时间会改变地图色调、交通线段亮度/线宽和订单点缩放，同时联动 Time Rhythm section。
- Hover Tooltip：鼠标悬停时显示模块轮廓、半透明高亮和简要指标。
- ETA Risk Ticket：点击餐厅、道路、天气区域、风险区域或客户区域后展示订单数、平均配送时长、延迟率、平均距离、风险评分和解释文本。
- Scenario Analysis Drawer：在 ETA Risk Ticket 中点击“查看完整分析”后，从右侧打开深度解释面板，包含场景概览、全局平均对比、距离-配送时长散点图、风险因素拆解和样例订单表。
- 路线清理：页面不再额外绘制不符合底图道路结构的粗大装饰路线，道路模块默认透明，仅在 hover 或 selected 时以细线高亮。

当前滚动式界面强调“筛选条件驱动的可视分析故事线”。点击左侧天气后，地图中的对应天气区域、风险脉冲、订单点和微型标签会保持突出，不相关风险标签与订单点降低透明度，右侧 Data Overview 同步切换到该天气的订单量、平均配送时长、延迟率和高风险组合解释。点击顶部时间后，地图色调、交通线段亮度/宽度、订单点 fade/scale 状态和 Time Rhythm 时间带会同步变化，右侧指标更新为对应时段语境。滚动进入不同 section 时，`activeSection` 会驱动右侧标题、分析问题和指标解释更新。

需要区分的是：当前已实现的是 scrollytelling 交互框架、SVG 地图热区、overlay 数据编码和 section 联动。部分 section 仍使用前端 mock / overlay 配置数据，后续可将 `public/data/*.json` 中的真实聚合结果接入 Weather Ranking、Traffic Roads、Outlier Scatter 和 Scenario Analysis Drawer。

## 架构说明

项目采用静态数据驱动架构，不需要 FastAPI、数据库或服务端动态查询。前端通过 Vite 提供的静态资源路径直接读取：

```text
public/data/*.json
```

如果对应 JSON 缺失或加载失败，前端会使用内置 mock 数据兜底，保证页面仍可打开和演示。当前数据聚合脚本会生成可供前端使用的 JSON 结果；需要接入真实静态数据时，将对应文件放到 `public/data/` 下即可。

当前主页仍遵循该架构：天气、时间和滚动 section 的联动均在 React 前端本地完成，不需要后端状态、数据库查询或服务端动态计算。

## 技术栈

- 前端：React 18、TypeScript、Vite、ECharts
- 数据处理：Python、pandas、numpy
- 数据来源：Kaggle Food Delivery Dataset

## 快速开始

### 1. 安装前端依赖

```bash
npm install
```

### 2. 启动前端开发服务器

```bash
npm run dev
```

默认地址是：

```text
http://localhost:5173
```

### 3. 构建生产版本

```bash
npm run build
```

本地预览构建结果：

```bash
npm run preview
```

## 数据集来源

- 数据集：Food Delivery Dataset
- 来源：Kaggle
- 当前处理使用链接：https://www.kaggle.com/datasets/gauravmalik26/food-delivery-dataset
- 规模：公开资料显示约 45,000 条外卖配送记录，满足课程建议“不少于 1 万条记录”的数据规模要求。

原始 CSV 不提交到仓库。请下载数据后将 CSV 重命名为 `food_delivery.csv`，放置到：

```text
data/raw/food_delivery.csv
```

## 项目结构

```text
.
├── data/
│   ├── raw/               # 本地原始 CSV，仓库不提交 data/raw/*.csv
│   └── processed/         # 清洗后的 CSV 和聚合 JSON
├── docs/                  # 数据说明、分析任务、前端设计和中期报告
├── scripts/               # 数据清洗、距离计算和聚合脚本
├── src/                   # React + TypeScript 前端源码
├── package.json           # 前端依赖和 npm scripts
├── requirements.txt       # 数据处理脚本依赖
└── vite.config.ts         # Vite 配置
```

## 可选：重新生成数据

仓库保留了 `data/processed/` 中的处理后数据。只有需要重新清洗 Kaggle 原始数据时，才需要执行本节。

### 1. 准备原始数据

从 Kaggle 下载 Food Delivery Dataset，解压后找到 `train.csv`，重命名为：

```text
food_delivery.csv
```

放到：

```text
data/raw/food_delivery.csv
```

### 2. 安装数据处理依赖

建议使用 Python 3.10 或更高版本：

```bash
pip install -r requirements.txt
```

### 3. 运行预处理脚本

```bash
python3 scripts/preprocess.py
```

脚本会读取 `data/raw/food_delivery.csv`，并覆盖更新 `data/processed/` 下的清洗 CSV 和聚合 JSON。

## 处理后数据文件

`data/processed/` 中的主要输出文件包括：

- `orders_clean.csv`：清洗后的订单级数据。
- `overview_summary.json`：总体概览指标。
- `delivery_time_distribution.json`：配送时长分布。
- `distance_time_sample.json`：距离与配送时长散点采样数据。
- `time_period_summary.json`：按时段聚合的统计结果。
- `hour_summary.json`：按小时聚合的统计结果。
- `weather_traffic_summary.json`：天气与交通组合统计。
- `courier_vehicle_summary.json`：骑手和车辆相关统计。
- `city_summary.json`：城市维度统计。
- `risk_scenario_summary.json`：配送风险场景排序结果。
- `delay_factor_flow.json`：延迟因素流向关系。
- `time_annotations.json`：时间趋势注释信息。

当前首页主要使用 `src/data/mapModules.ts` 与 `src/data/mapOverlayData.ts` 中的 mock/overlay 数据驱动交互热区和滚动 section。前端仍保持纯静态数据架构：优先读取 `public/data/*.json`，缺失时使用内置 mock，不需要后端、数据库或服务端动态查询。

Delivery Operation Map 的当前映射如下：

- 背景图：`public/assets/delivery_city_map.png` 呈现完整外卖配送城市运行场景和场景标签。
- 交互模块：`src/data/mapModules.ts` 定义餐厅、建筑、道路、天气区域、风险区域、客户区域和骑手节点。
- 数据图层：`src/data/mapOverlayData.ts` 定义 `trafficSegments`、`orderDots`、`scenarioAnchors` 和 `miniMetricTags`。交通线段颜色映射 `traffic_density`、线宽映射 `order_count`；订单点大小映射订单压力或配送时长、颜色映射高延迟；脉冲圈半径映射 `risk_score`；微型标签展示 `delay_rate` 和 `avg_delivery_duration_min`。
- 紧凑图例：地图角落保留小型半透明 legend，解释线条颜色、点大小、红橙风险和脉冲圈含义，不恢复大型 dashboard 图例。
- 视觉反馈：模块类型决定 hover 边框颜色；`order_count`、`avg_delivery_duration_min`、`delay_rate`、`avg_distance_km` 和 `risk_score` 展示在 tooltip 与 ETA Risk Ticket 中。
- 坐标系统：所有热区和 overlay 元素使用 `1600 x 1000` viewBox，后续微调只需要修改 `mapModules.ts` 或 `mapOverlayData.ts`。

当前页面结构为：

```text
Top Time Selector
Left Weather Panel | Scrolling Analysis Sections | Right Data Overview
```

中间 6 个 section 包括：

- Operation Overview：Delivery Operation Map 背景图 + SVG overlay + tooltip + ETA Risk Ticket。
- Weather Impact：天气风险横向排行，点击天气行会同步左侧天气筛选。
- Traffic Pressure：简化道路 overlay，颜色表示交通压力，线宽表示订单量。
- Time Rhythm：Morning 到 Night 的时间带，宽度表示订单量，颜色表示延迟率。
- Risk Scenario Explain：Top 高风险场景排行，表达多属性条件组合风险。
- Outlier Orders：距离-配送时长散点图，用于定位异常订单。

当前交互流程为：

```text
Delivery Operation Map
  -> 点击地图模块
ETA Risk Ticket
  -> 点击“查看完整分析”
Scenario Analysis Drawer
```

Scenario Analysis Drawer 不改变首页主视觉，也不引入新路由。它作为 details-on-demand 层覆盖在地图右侧，用 mock 订单点生成距离-配送时长散点图和样例订单表。后续接入真实 processed JSON 时，可将 `scenario_orders_sample.json`、`distance_time_sample.json` 和场景聚合指标替换为真实订单样本。

## 后续计划

- 将真实 processed JSON 的聚合指标接入 `mapModules.ts` 或生成等价模块配置。
- 将 Scenario Analysis Drawer 中的 mock 订单点替换为 `scenario_orders_sample.json` 或 `distance_time_sample.json` 的真实样本。
- 根据最终背景图位置微调 `mapModules.ts` 中各模块坐标。
- 补充围绕高风险配送场景的 case study，用于课程展示和最终报告。
- 根据真实静态数据接入情况，整理 `public/data/` 与 `data/processed/` 之间的数据发布流程。

## 相关文档

- `docs/data_description.md`：数据字段和处理说明。
- `docs/analysis_tasks.md`：分析任务定义。
- `docs/system_design.md`：纯前端系统结构和数据流设计。
- `docs/future_work.md`：后续计划。
- `docs/midterm_report.tex` / `docs/midterm_report.pdf`：中期报告。

## AI 使用说明

本项目允许使用 AI 辅助字段整理、代码草稿生成、文档初稿撰写和表达润色。团队需要审查 AI 生成内容，确认字段解释、清洗规则、分析任务和可视化方案符合课程要求与实际数据。AI 不替代数据验证、设计决策和最终报告责任。
