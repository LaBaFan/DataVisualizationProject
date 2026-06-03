# FoodETA 外卖配送时效可视分析

FoodETA 是一个用于“数据可视化导论”课程 project 的外卖配送数据可视分析系统。项目基于 Kaggle Food Delivery Dataset，围绕配送时长、配送距离、天气、交通、时段、城市、骑手属性和车辆类型，构建可运行的纯前端 React 应用。

当前主页不再以普通 dashboard 作为入口，而是以 **Delivery Risk Map** 作为主要工作区：先从高延迟风险场景进入，再查看时段、天气交通组合和右侧详情解释。

## 功能概览

- Delivery Risk Map：用矩形面积表示订单规模，用颜色表示风险分，点击任一风险场景可在右侧查看风险解释、样例订单和延迟构成。
- Temporal Summary Strip：按时段展示订单量、平均配送时长和延迟率；点击时段会更新筛选状态，并联动右侧详情。
- Weather × Traffic Matrix：展示天气与交通组合下的延迟率和风险分；点击矩阵单元会同步天气、交通筛选，并联动右侧详情。
- 左侧筛选面板：维护城市、天气、交通、车辆、时段和是否延迟等筛选状态。
- 右侧详情面板：根据当前点击的风险场景、时段条、天气交通矩阵或订单样例展示 details-on-demand 信息。

## 架构说明

项目采用静态数据驱动架构，不需要 FastAPI、数据库或服务端动态查询。前端通过 Vite 提供的静态资源路径直接读取：

```text
public/data/*.json
```

如果对应 JSON 缺失或加载失败，前端会使用内置 mock 数据兜底，保证页面仍可打开和演示。当前数据聚合脚本会生成可供前端使用的 JSON 结果；需要接入真实静态数据时，将对应文件放到 `public/data/` 下即可。

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

当前首页主要读取 `overview_summary.json`、`risk_scenario_summary.json`、`time_period_summary.json` 和 `weather_traffic_summary.json`。前端也会尝试读取 `scenario_orders_sample.json` 作为详情样例数据；该文件缺失时会使用 mock 或基于场景生成的 fallback 样例。

## 后续计划

- 继续完善 Delivery Risk Map、时段条、天气交通矩阵与详情面板之间的多视图联动。
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
