# FoodETA 外卖配送时效可视分析

FoodETA 是一个用于“数据可视化导论”课程 project 的外卖配送数据可视分析系统。项目基于 Kaggle Food Delivery Dataset，围绕配送时长、配送距离、天气、交通、时段、城市、骑手属性和车辆类型，构建可运行的纯前端 React 应用。

当前主页采用 **Overall Map Explorer / 总入口地图式可视分析界面**。用户先进入 overall 总览地图，再通过左侧场景导航、地图热区、顶部时间筛选和右侧指标面板进入天气、区域、交通和高风险场景分析。旧的滚动 section 组件仍可作为历史分析视图或完整分析入口使用，但当前主页入口不再以 6 个滚动 section 作为主体。

## 功能概览

- Top TimeSelector：顶部时间筛选，支持 All、Morning、Noon、Afternoon、Evening、Night 等时段语境。
- Left SceneNavigation：左侧场景导航，组织总览、天气模块和区域模块。
- Center InteractiveSceneMap：中间主地图，支持 overall 总入口图、子模块背景图、SVG 热区和数据 overlay。
- Right Analysis Panel / DataOverviewPanel：右侧分析面板，根据当前场景、天气、时段和选中对象展示关键指标与解释。
- OverallHotspotLayer：overall 地图上提供至少 8 个入口热区，点击后进入对应子场景或分析模块。
- Hover Tooltip：鼠标悬停地图热区、overlay 或风险元素时显示简要指标。
- ETA Risk Ticket：点击场景、热区或数据元素后展示订单数、平均配送时长、延迟率、平均距离、风险评分和分析入口。
- 真实聚合优先：前端优先读取 `public/data/*.json` 中的真实聚合结果；加载失败时使用内置 mock 作为 fallback，保证页面仍可演示。

## 页面结构

```text
Top TimeSelector
Left SceneNavigation | Center InteractiveSceneMap | Right DataOverviewPanel
```

核心视图由以下组件组织：

- `FoodETAMapExplorer`：主页三栏布局容器。
- `SceneNavigation`：左侧场景入口，负责切换 selectedSceneId，并同步天气/时段语境。
- `InteractiveSceneMap`：中间地图画布，按当前 scene 渲染背景图、热区、HUD 和 overlay。
- `OverallHotspotLayer`：overall 总入口地图上的 SVG 热区层。
- `DataOverviewPanel`：右侧分析面板，展示当前场景、筛选条件和选中对象的指标。
- `TimeSelector`：顶部时间选择器。

## 地图场景与图片资源

页面运行时使用的地图图片集中在：

```text
public/assets/maps/
```

源图集中在：

```text
source_assets/maps/
```

根目录不再放散落 png；新增或替换地图资源时，应先整理到上述目录，再由前端按静态资源路径引用。

当前 scene 包括：

- `overall`
- `sunny`
- `cloudy`
- `fog_business`
- `storm_area`
- `sandstorm`
- `windy`
- `dispatch_center`
- `restaurant_street`
- `traffic_hub`
- `high_risk_residential`
- `night_low_peak`
- `mixed_food_community`

其中 `overall` 是总入口地图。天气类 scene 对应不同天气条件；区域类 scene 用业务 proxy 表达餐厅街区、调度中心、交通枢纽、高风险居住区、夜间低峰和混合餐饮社区等配送场景。`scene_summary.json` 中的区域类 scene 基于真实订单规则聚合得到，不代表真实 GIS 边界或真实行政区域。

## 架构说明

项目采用静态数据驱动架构，不需要 FastAPI、数据库或服务端动态查询。数据流为：

```text
data/raw/food_delivery.csv
  -> scripts/preprocess.py
  -> data/processed/*.csv / *.json
  -> scripts/sync_public_data.py
  -> public/data/*.json
  -> React fetch / staticDataClient / scene metrics
```

如果 `public/data/` 中的 JSON 缺失或加载失败，前端会使用内置 mock 数据兜底。当前真实聚合 JSON 已生成并同步到 `public/data/`，主页 HUD、右侧 DataOverviewPanel 和部分分析视图优先读取这些真实聚合结果。

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
- 当前清洗后订单规模：`45162` 条。
- 天气字段非空合计：`44695` 条。
- 交通字段非空合计：`44708` 条。

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
├── docs/                  # 数据说明、分析任务、前端设计和系统设计文档
├── public/
│   ├── assets/maps/       # 页面运行时使用的地图图片
│   └── data/              # 前端直接读取的静态 JSON
├── scripts/               # 数据清洗、聚合和 public/data 同步脚本
├── source_assets/maps/    # 地图源图
├── src/                   # React + TypeScript 前端源码
├── package.json           # 前端依赖和 npm scripts
├── requirements.txt       # 数据处理脚本依赖
└── vite.config.ts         # Vite 配置
```

## 处理后数据文件

`data/processed/` 和 `public/data/` 中的关键 JSON 包括：

- `overview_summary.json`：总体概览指标。
- `weather_impact_summary.json`：按天气聚合的订单量、平均配送时长、延迟率和风险指标。
- `traffic_density_summary.json`：按 Low、Medium、High、Jam 聚合的交通压力分层统计。
- `scene_summary.json`：面向地图 scene 的聚合指标；区域类 scene 是真实订单规则 proxy，不是真实 GIS 区域。
- `scene_filter_summary.json`：按 scene、weather 和 time_period 交叉聚合的真实样本统计，供地图 HUD 和右侧面板随筛选联动。
- `risk_scenario_summary.json`：天气、交通、时段、车辆等组合下的风险场景聚合。
- `scenario_orders_sample.json`：风险场景代表订单样本。
- `scenario_distance_time_points.json`：按风险场景抽样的距离-时长散点。
- `distance_time_sample.json`：全局距离-配送时长散点采样数据。

其他辅助文件包括 `time_period_summary.json`、`hour_summary.json`、`weather_traffic_summary.json`、`courier_vehicle_summary.json`、`city_summary.json`、`delay_factor_flow.json` 和 `time_annotations.json`。

## 重新生成数据

仓库保留了 `data/processed/` 中的处理后数据。只有需要重新清洗 Kaggle 原始数据或刷新聚合结果时，才需要执行本节。

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

### 3. 重新生成并同步数据

```bash
python3 scripts/preprocess.py
python3 scripts/sync_public_data.py
npm run build
```

`preprocess.py` 会覆盖更新 `data/processed/` 下的清洗 CSV 和聚合 JSON；`sync_public_data.py` 会将前端需要的 JSON 同步到 `public/data/`；`npm run build` 用于验证静态数据和前端类型构建。

## 交互与数据语义

当前主页围绕 `selectedSceneId`、`selectedWeather`、`selectedTimePeriod` 和 `selectedItem` 管理交互状态。用户可以从 overall 热区进入子模块，也可以通过左侧导航切换 scene。时间筛选会影响 overlay 和 HUD 的语境；天气 scene 会同步天气筛选；点击具体元素后，右侧面板切换为 ETA Risk Ticket。

HUD 和右侧指标不再依赖 overlay mock 求和。overall、天气、时间、交通、区域和风险场景会按不同 summary 来源取数；当真实 JSON 不可用时才回落到 mock fallback。

## 后续计划

- 继续校准 `public/assets/maps/` 中子场景图片和 SVG 热区坐标。
- 补充更多基于真实订单样本的 case study，用于课程展示和最终报告。
- 在不改变纯静态架构的前提下，完善 scene 与完整分析视图之间的跳转说明。

## 相关文档

- `docs/data_description.md`：数据字段和处理说明。
- `docs/analysis_tasks.md`：分析任务定义。
- `docs/system_design.md`：纯前端系统结构和数据流设计。
- `docs/future_work.md`：后续计划。
- `docs/midterm_report.tex` / `docs/midterm_report.pdf`：中期报告。

## AI 使用说明

本项目允许使用 AI 辅助字段整理、代码草稿生成、文档初稿撰写和表达润色。团队需要审查 AI 生成内容，确认字段解释、清洗规则、分析任务和可视化方案符合课程要求与实际数据。AI 不替代数据验证、设计决策和最终报告责任。
