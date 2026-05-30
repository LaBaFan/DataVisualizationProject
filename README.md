# FoodETA 外卖配送时效可视分析

FoodETA 是一个用于“数据可视化导论”课程 project 的外卖配送数据可视分析系统。项目基于 Kaggle Food Delivery Dataset，围绕配送时长、配送距离、天气、交通、时段、城市、骑手属性和车辆类型，构建可运行的 React dashboard，并提供一个可选的 FastAPI 数据接口层。

前端会优先请求本地后端的 `/api/*` 接口；如果后端没有启动或接口不可用，会自动回退到仓库中的 `data/processed/*.json` 静态聚合数据。因此，只想查看前端效果时不必先启动后端。

## 功能概览

- 多视图 dashboard：总览、配送时长分布、距离-时长散点、小时趋势、天气交通、骑手车辆、城市对比、风险排序、延迟因素流和时间注释。
- 左侧筛选面板：维护城市、天气、交通、车辆和时段筛选状态。
- 右侧详情面板：展示当前视图和筛选状态，预留图元点击后的 details-on-demand 信息。
- 数据处理脚本：清洗 Kaggle CSV，计算配送距离、时段、延迟标签、速度等派生字段，并输出前端可直接使用的聚合 JSON。
- 可选后端 API：用 FastAPI 将 `data/processed/` 下的 JSON 暴露为接口，便于前后端联调。

## 技术栈

- 前端：React 18、TypeScript、Vite、ECharts
- 后端：FastAPI、Uvicorn
- 数据处理：Python、pandas、numpy
- 数据来源：Kaggle Food Delivery Dataset

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
├── backend/               # FastAPI 后端，读取 processed JSON 并提供 /api 接口
├── data/
│   ├── raw/               # 本地原始 CSV，仓库不提交 data/raw/*.csv
│   └── processed/         # 已清洗 CSV 和聚合 JSON，前端可静态读取
├── docs/                  # 数据说明、分析任务、系统设计和中期报告
├── scripts/               # 数据清洗、距离计算和聚合脚本
├── src/                   # React + TypeScript 前端源码
├── package.json           # 前端依赖和 npm scripts
├── requirements.txt       # 数据处理脚本依赖
└── vite.config.ts         # Vite 配置，含 /api 到 8000 端口的代理
```

## 快速开始

### 1. 安装前端依赖

项目使用 npm，仓库已包含 `package-lock.json`：

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

此时即使不启动后端，前端也会读取 `data/processed/` 中已经提交的聚合 JSON。

### 3. 构建生产版本

```bash
npm run build
```

构建产物会输出到 `dist/`。本地预览构建结果：

```bash
npm run preview
```

## 可选：启动后端 API

如果需要测试前后端接口联通，先安装后端依赖：

```bash
pip install -r backend/requirements.txt
```

启动后端：

```bash
cd backend
uvicorn main:app --reload --port 8000
```

后端默认允许 `http://localhost:5173` 和 `http://127.0.0.1:5173` 跨域访问。前端开发服务器也配置了 `/api` 代理到 `http://localhost:8000`。

可用接口：

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

数据接口统一返回：

```json
{
  "data_available": true,
  "data": {},
  "source_file": "data/processed/example.json"
}
```

如果对应 JSON 文件不存在，接口会返回 `data_available: false` 和空数据，而不是让服务崩溃。

## 可选：重新生成数据

仓库已经提交了 `data/processed/` 中的处理后数据，可以直接运行前端。只有需要重新清洗 Kaggle 原始数据时，才需要执行本节。

### 1. 准备原始数据

从 Kaggle 下载 Food Delivery Dataset：

```text
https://www.kaggle.com/datasets/gauravmalik26/food-delivery-dataset
```

解压后找到 `train.csv`，重命名为：

```text
food_delivery.csv
```

放到：

```text
data/raw/food_delivery.csv
```

原始 CSV 不提交到仓库，`.gitignore` 已忽略 `data/raw/*.csv`。

### 2. 安装数据处理依赖

建议使用 Python 3.10 或更高版本：

```bash
pip install -r requirements.txt
```

### 3. 运行预处理脚本

```bash
python3 scripts/preprocess.py
```

如果本地环境使用 `python` 命令，也可以运行：

```bash
python scripts/preprocess.py
```

脚本会读取 `data/raw/food_delivery.csv`，并覆盖更新 `data/processed/` 下的清洗 CSV 和聚合 JSON。

## 数据处理逻辑

预处理流程主要包括：

1. 读取 `data/raw/food_delivery.csv`。
2. 将字段名标准化为 snake_case，并兼容常见空格、大小写差异和 NaN 字符串。
3. 从 `Time_taken(min)` 中提取配送时长数字，兼容 `(min) 24` 和 `24` 等格式。
4. 校验餐厅和配送位置经纬度，删除明显异常或缺失记录。
5. 使用 haversine 公式计算 `distance_km`。
6. 解析订单小时；若 `Time_Orderd` 缺失，则尝试 `Time_Order_picked`。
7. 根据 `Order_Date` 解析 `weekday`。
8. 生成时段、延迟标签、配送速度等派生字段。
9. 输出订单级清洗数据和多个聚合 JSON。

核心派生字段：

- `delivery_duration_min`：配送时长，单位分钟。
- `distance_km`：餐厅到配送地点的球面距离，单位千米。
- `order_hour`：订单小时。
- `weekday`：订单日期对应星期。
- `time_period`：`breakfast`、`lunch_peak`、`afternoon`、`dinner_peak`、`night` 或 `unknown`。
- `is_delayed`：配送时长是否严格大于 75 分位数阈值。
- `speed_kmph`：配送速度，异常值会置空。

时段规则：

- 06:00-10:00：`breakfast`
- 10:00-14:00：`lunch_peak`
- 14:00-17:00：`afternoon`
- 17:00-21:00：`dinner_peak`
- 21:00-06:00：`night`
- 无法解析：`unknown`

## 处理后数据文件

`data/processed/` 中的主要输出文件包括：

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

## 分析任务

- T1：分析配送时间整体分布。
- T2：探索配送距离与配送时间关系。
- T3：比较天气和交通状况对配送时效的影响。
- T4：分析不同时段的配送效率差异。
- T5：分析骑手属性与车辆类型对配送表现的影响。
- T6：识别高延迟风险场景组合。

详细定义见 `docs/analysis_tasks.md`。

## 可视化设计参考

项目的多视图设计借鉴了三个经典系统的思想，但没有直接复用其实现：

- LineUp：借鉴多属性排序思想，设计 Delivery Risk Ranking View，将天气、交通密度、时段、距离、多单配送和骑手评分组合为配送延迟风险场景，并按风险分数、延迟率或平均配送时长排序。
- Parallel Sets：借鉴多类别路径关系表达，设计 Delay Factor Flow View，展示 `weather -> traffic_density -> time_period -> is_delayed` 等条件路径。
- TimeNotes：借鉴时间序列注释思想，设计 Annotated Temporal Pattern View，在小时趋势中标注午高峰、晚高峰、订单量峰值和延迟率峰值。

团队自己的设计重点是围绕“外卖配送延迟风险场景识别”组织多视图分析流程，将单条订单数据提升为可解释的条件组合、路径关系和时段注释。

## 相关文档

- `docs/data_description.md`：数据字段和处理说明。
- `docs/analysis_tasks.md`：分析任务定义。
- `docs/system_design.md`：系统结构和前后端设计。
- `docs/future_work.md`：后续计划。
- `docs/midterm_report.md`：中期报告草稿。

## AI 使用说明

本项目允许使用 AI 辅助字段整理、代码草稿生成、文档初稿撰写和表达润色。团队需要审查 AI 生成内容，确认字段解释、清洗规则、分析任务和可视化方案符合课程要求与实际数据。AI 不替代数据验证、设计决策和最终报告责任。
