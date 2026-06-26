# FoodETA 外卖配送时效可视分析系统

FoodETA 是一个用于“数据可视化导论”课程 project 的纯前端可视分析系统。项目基于 Kaggle Food Delivery Dataset，对外卖配送订单进行离线清洗与聚合，并围绕天气、交通、时段、车辆类型、配送距离和配送时长分析 ETA 波动。

最终版系统采用 **Overall + 六个 Weather Module** 的结构：用户先在 Overall 页面查看全局配送指标和天气入口，再进入 `Sunny`、`Fog`、`Stormy`、`Sandstorms`、`Cloudy`、`Windy` 六个天气模块。每个 Weather Module 都包含 `Overview`、`Traffic`、`Time`、`Vehicle`、`Risk`、`Orders` 六个子分析视图，形成一致的探索路径。

公网演示地址：<https://foodeta.labafan.cc/>

## 环境要求

本项目最终验证使用的 Node.js 版本为：

```bash
Node.js v22.13.1
npm 10.9.2
```

建议使用 `nvm` 固定版本：

```bash
nvm install 22.13.1
nvm use 22.13.1
```

数据处理脚本使用 Python 3.10 或更高版本。若只运行前端页面，不需要执行 Python 脚本。

## 快速开始

### 1. 安装前端依赖

```bash
npm ci
```

如没有 `package-lock.json` 或需要更新依赖，可使用：

```bash
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

默认地址：

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

## 项目结构

```text
.
├── data/
│   ├── raw/                 # 本地原始 CSV，仓库不提交 data/raw/*.csv
│   └── processed/           # 清洗后的 CSV 和聚合 JSON
├── docs/                    # 数据说明、分析任务和系统设计文档
├── public/
│   ├── assets/backgrounds/  # Overall 与六个天气模块的运行时背景图
│   └── data/                # 前端直接读取的静态 JSON
├── scripts/                 # 数据清洗、聚合和 public/data 同步脚本
├── source_assets/maps/      # 背景图源文件
├── src/                     # React + TypeScript 前端源码
├── package.json             # npm scripts 和前端依赖
├── package-lock.json        # 依赖锁定文件
├── requirements.txt         # 数据处理脚本依赖
└── vite.config.ts           # Vite 配置
```

## 功能概览

- `Overall`：展示有效订单数、平均配送时长、延迟率、平均距离等全局基线，并提供六个天气模块入口。
- `Weather Comparison`：比较不同天气条件下的订单量、平均配送时长和延迟率。
- `Weather Module`：针对单一天气展示 Overview、Traffic、Time、Vehicle、Risk、Orders 六个子视图。
- `Interactive Map`：使用天气场景图、热区、指标标签和局部图表承载交互分析。
- `Analysis Panel`：根据当前天气、子视图和选中元素展示数据过滤条件、核心指标和解释文本。
- `Orders`：通过距离-配送时长样本发现短距离长耗时等异常订单模式。

## 技术栈

- 前端：React 18、TypeScript、Vite、ECharts
- 数据处理：Python、pandas、numpy
- 数据来源：Kaggle Food Delivery Dataset
- 架构：静态 JSON 数据 + 纯前端渲染，无数据库和后端动态 API

## 数据说明

项目使用 Kaggle Food Delivery Dataset。原始 CSV 不提交到仓库；仓库中保留处理后的聚合数据，保证前端可以直接运行。

当前处理后主要规模：

- 原始订单记录数：45,593 条
- 有效清洗订单数：45,162 条
- 平均配送时长：26.298 分钟
- 配送时长中位数：26.0 分钟
- 延迟阈值：32.0 分钟
- 整体延迟率：24.7%
- 平均配送距离：9.735 千米

前端运行时主要读取 `public/data/` 下的静态 JSON：

- `overview_summary.json`：总体概览指标。
- `weather_impact_summary.json`：按天气聚合的订单量、平均配送时长、延迟率和平均距离。
- `weather_traffic_summary.json`：天气与交通密度交叉统计。
- `time_period_summary.json`：按履约时段聚合的配送表现。
- `traffic_density_summary.json`：按交通密度聚合的配送表现。
- `scene_filter_summary.json`：按天气模块和时段交叉聚合的筛选结果。
- `risk_scenario_summary.json`：天气、交通、时段、车辆等组合下的高延迟场景统计。
- `distance_time_sample.json`：订单级距离-配送时长采样点。
- `scenario_distance_time_points.json`：组合场景下的订单级散点样本。
- `scenario_orders_sample.json`：代表性订单样本。

## 重新生成数据

只有在需要重新清洗 Kaggle 原始数据或刷新聚合结果时，才需要执行本节。

### 1. 准备原始数据

从 Kaggle 下载 Food Delivery Dataset，解压后找到原始 CSV，并重命名为：

```text
food_delivery.csv
```

放到：

```text
data/raw/food_delivery.csv
```

### 2. 安装 Python 依赖

建议使用 Python 虚拟环境：

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 3. 重新清洗并同步前端数据

```bash
python3 scripts/preprocess.py
python3 scripts/sync_public_data.py
npm run build
```

`preprocess.py` 会生成 `data/processed/` 下的清洗 CSV 和聚合 JSON；`sync_public_data.py` 会将前端需要的 JSON 同步到 `public/data/`。

## 常用命令

```bash
npm ci          # 按 lockfile 安装依赖
npm run dev    # 启动开发服务器
npm run build  # TypeScript 检查并构建生产版本
npm run preview# 预览生产构建
```

## 上交说明

最终版源代码不需要提交以下本地生成内容：

- `node_modules/`
- `dist/`
- `.venv/`
- `.DS_Store`
- `data/raw/*.csv`
- 本地缓存、日志和临时文件

这些内容已在 `.gitignore` 中配置忽略。评审者可以通过 `npm ci` 和 `npm run dev` 复现前端环境。

## AI 使用说明

本项目允许使用 AI 辅助代码整理、文档初稿、表达润色和调试建议。团队负责确认数据清洗规则、系统结构、可视化设计、交互逻辑和最终提交内容；AI 输出不替代团队的设计决策和结果验证。
