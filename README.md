# FoodETA：外卖配送时效与延迟因素可视分析系统

英文名称：**FoodETA: Visual Analytics System for Food Delivery Time and Delay Factors**

## 1. 项目背景

FoodETA 是“数据可视化导论”课程 project 的初步设计。本项目基于公开外卖配送时间数据，计划构建一个面向外卖配送效率分析的多视图可视分析系统。

系统将从配送时间、配送距离、天气状况、交通状况、订单时间、骑手属性、车辆类型和城市差异等角度展开分析，帮助用户发现影响外卖配送时效的关键因素、识别高延迟订单模式，并比较不同条件下的配送效率差异。

当前 README 是项目初稿，主要用于明确数据来源、字段设计、分析任务、视图设计、交互设计、技术路线和后续实现计划。文中未完成的功能均以“计划支持”“当前设计为”“待实现”等方式描述。

## 2. 数据集说明

### 2.1 数据来源

主数据集：**Food Delivery Time**

- 数据集链接：https://www.kaggle.com/datasets/rajatkumar30/food-delivery-time
- 数据来源：Kaggle 公开数据集

该数据集目标是预测配送员从餐厅到顾客位置完成配送所需时间，字段包括配送员年龄、评分、餐厅与配送位置经纬度、天气、交通密度、订单类型、车辆类型、配送时长等。该数据适合用于分析外卖配送时效及其影响因素。

背景材料可参考：

- Food Delivery Time Prediction in Indian Cities Using Machine Learning Models：https://arxiv.org/html/2503.15177v1

该论文提到其使用的公开 Kaggle 外卖配送数据约包含 45,000 条印度城市外卖配送记录，每条记录包含配送时间相关特征和目标变量 `Time_taken(min)`。本项目最终记录数量以实际下载的数据文件为准。

### 2.2 数据特点

- 数据来自公开数据集平台 Kaggle。
- 每条记录代表一次外卖配送订单或配送样本。
- 数据具有时间属性、空间属性、订单属性、环境属性和骑手属性。
- 数据规模足以支撑课程要求中“建议不少于 1 万条记录”的要求。
- 如果原始数据存在字段不统一、缺失值或格式问题，项目会在 `scripts/preprocess.py` 中进行清洗。
- 如果完整数据量或字段不适合前端直接加载，项目会生成聚合后的 JSON/CSV 文件用于可视化。

## 3. 主要字段说明

字段名称可能随不同 Kaggle 数据集或实际下载文件略有不同。字段以实际下载文件为准，预处理阶段会统一字段命名。

### 3.1 订单与配送时间字段

- `ID` / `Order_ID`
- `Order_Date`
- `Time_Orderd`
- `Time_Order_picked`
- `Time_taken(min)`

### 3.2 空间位置字段

- `Restaurant_latitude`
- `Restaurant_longitude`
- `Delivery_location_latitude`
- `Delivery_location_longitude`
- `distance_km`，若原始数据没有，需要根据经纬度计算

### 3.3 骑手属性字段

- `Delivery_person_ID`
- `Delivery_person_Age`
- `Delivery_person_Ratings`

### 3.4 环境与交通字段

- `Weatherconditions` / `Weather`
- `Road_traffic_density` / `Traffic_Level`
- `Festival`
- `City`

### 3.5 订单与配送方式字段

- `Type_of_order`
- `Type_of_vehicle`
- `Vehicle_condition`
- `multiple_deliveries`

### 3.6 派生字段

- `delivery_duration_min`
- `pickup_delay_min`
- `order_hour`
- `time_period`，例如 `morning` / `lunch_peak` / `afternoon` / `dinner_peak` / `night`
- `is_delayed`，例如配送时间超过某一阈值
- `distance_bin`，例如 `0-2km`、`2-5km`、`5-10km`、`10km+`
- `speed_km_per_hour`，若能合理计算

## 4. 核心分析任务

### T1：分析配送时间的整体分布

基于 `Time_taken(min)` 或 `delivery_duration_min`，分析外卖配送时长的分布、均值、中位数、长尾订单和异常延迟订单。

### T2：探索距离与配送时间之间的关系

基于餐厅与配送地点经纬度计算配送距离，分析 `distance_km` 与 `delivery_duration_min` 之间的关系，识别“短距离但长时间”或“长距离但高效率”的异常样本。

### T3：分析天气和交通状况对配送时效的影响

比较不同 `Weatherconditions` 和 `Road_traffic_density` 下的平均配送时长、延迟率和长尾分布，发现恶劣天气或高交通密度下的配送压力。

### T4：比较不同时段的配送效率差异

基于订单时间和取餐时间，分析早晨、午高峰、下午、晚高峰、夜间等时段的订单量、平均配送时长和延迟率。

### T5：分析骑手属性与配送表现之间的关系

基于 `Delivery_person_Age`、`Delivery_person_Ratings`、`multiple_deliveries`、`Type_of_vehicle` 等字段，比较不同骑手群体或配送方式下的时效差异。

### T6：识别高延迟风险场景组合

通过组合筛选，例如“晚高峰 + 高交通密度 + 雨天 + 多单配送”或“远距离 + 低评分骑手 + 摩托车/自行车”，发现配送延迟风险较高的典型场景。

## 5. 系统视图设计

系统当前设计为多视图协调的可视分析界面，计划包含以下视图。

### 5.1 Overview Dashboard

- 展示总订单数、平均配送时长、中位数配送时长、延迟订单比例。
- 展示平均配送距离、主要城市/区域、主要天气和交通状态。
- 展示订单量最多的时段、配送时长最高的条件组合。

### 5.2 Delivery Time Distribution View

- 展示配送时长直方图、箱线图或密度分布。
- 支持按城市、天气、交通状况、车辆类型和订单类型筛选。
- 突出长尾延迟订单。

### 5.3 Distance-Time Scatter View

- 横轴为配送距离 `distance_km`。
- 纵轴为配送时长 `delivery_duration_min`。
- 颜色编码交通状况或天气。
- 点大小可编码 `multiple_deliveries` 或骑手评分。
- 支持 brushing，框选异常订单后联动详情面板和其他视图。

### 5.4 Temporal Pattern View

- 展示订单量和平均配送时长随小时变化。
- 支持工作日/周末或不同日期聚合。
- 可以设计“小时 x 交通密度”或“小时 x 天气”的热力图。
- 用于发现午高峰、晚高峰、夜间订单模式。

### 5.5 Weather & Traffic Impact View

- 展示不同天气、交通密度下的配送时长和延迟率。
- 可使用分组柱状图、堆叠柱状图、热力矩阵或箱线图。
- 重点比较不同外部环境对配送效率的影响。

### 5.6 Courier & Vehicle View

- 展示骑手年龄、评分、车辆类型、多单配送等因素与配送时长的关系。
- 可以用箱线图、散点图或分组柱状图。
- 用于分析骑手属性和配送方式是否影响配送表现。

### 5.7 Spatial / City View

- 如果数据包含经纬度，可以展示餐厅位置、配送位置或订单流向。
- 可使用地图点图、热力图或城市对比图。
- 如果地图实现成本较高，可以先做城市/区域层面的对比视图。
- 支持点击城市或区域后联动其他视图。

### 5.8 Detail Panel

- 点击订单点、时段、天气、交通状态、城市或骑手群体后，展示详细统计。
- 包括订单数、平均配送时长、延迟率、距离分布、典型样本等。
- 支持 details-on-demand。

## 6. 交互设计

系统计划支持以下交互：

- 时间筛选：按日期、小时或自定义时段筛选订单。
- 城市/区域筛选：按 `City` 或地图区域筛选订单。
- 环境条件筛选：按 `Weatherconditions`、`Road_traffic_density`、`Festival` 等字段筛选。
- 配送方式筛选：按 `Type_of_vehicle`、`Type_of_order`、`multiple_deliveries` 筛选。
- Brushing & linking：在距离-时间散点图中框选异常订单后，其他视图同步更新。
- Details-on-demand：点击订单点、天气类别、交通状态、时段或城市后，右侧详情面板展示对应统计。
- 多条件组合筛选：支持组合查询，例如“晚高峰 + 雨天 + 高交通密度 + 多单配送”。
- 延迟风险高亮：对配送时间明显高于同距离/同时段平均水平的订单或条件组合进行提示。

## 7. 技术栈

当前计划使用以下技术栈，后续会根据数据规模、地图需求和开发进度进行调整：

- Frontend: React + TypeScript + Vite
- Visualization: ECharts / D3.js
- Map Visualization: Leaflet / Mapbox GL JS，可选；如果地图实现成本较高，初期先实现城市/区域对比视图
- Data Processing: Python + pandas
- Package Manager: npm
- Optional: scikit-learn，用于简单聚类、异常检测或延迟风险分组

## 8. 目录结构

当前计划的项目目录结构如下：

```text
FoodETA/
├── README.md
├── package.json
├── index.html
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── components/
│   ├── views/
│   │   ├── OverviewView.tsx
│   │   ├── DeliveryTimeDistributionView.tsx
│   │   ├── DistanceTimeScatterView.tsx
│   │   ├── TemporalPatternView.tsx
│   │   ├── WeatherTrafficView.tsx
│   │   ├── CourierVehicleView.tsx
│   │   └── SpatialCityView.tsx
│   ├── utils/
│   └── styles/
├── data/
│   ├── raw/
│   └── processed/
├── scripts/
│   ├── preprocess.py
│   ├── compute_distance.py
│   ├── aggregate_by_time.py
│   └── aggregate_by_condition.py
└── docs/
```

目录说明：

- `src/`：前端源代码目录。
- `src/components/`：通用组件，例如筛选器、图例、统计卡片、详情面板等。
- `src/views/`：主要可视化视图。
- `src/utils/`：数据加载、字段映射、指标计算、交互状态管理等工具函数。
- `src/styles/`：样式文件。
- `data/raw/`：原始 Kaggle 外卖配送 CSV 文件。
- `data/processed/`：预处理后供前端读取的 JSON/CSV 文件。
- `scripts/`：数据预处理、距离计算和聚合脚本。
- `docs/`：系统设计文档、AI 使用声明、答辩材料等。

## 9. 数据预处理

数据预处理脚本计划放在 `scripts/preprocess.py`，示例运行命令如下：

```bash
python scripts/preprocess.py
```

`scripts/preprocess.py` 计划完成：

- 读取外卖配送原始 CSV。
- 统一字段命名。
- 处理缺失值和异常值。
- 解析订单时间和取餐时间。
- 生成 `order_hour`、`weekday`、`time_period` 等时间字段。
- 根据餐厅经纬度和配送位置经纬度计算 `distance_km`。
- 清洗 `Time_taken(min)`，生成 `delivery_duration_min`。
- 根据配送时长阈值或同距离分组均值生成 `is_delayed`。
- 按时间、城市、天气、交通状况、订单类型、车辆类型聚合。
- 生成前端可读取的 JSON/CSV 文件。
- 如果数据量过大，支持采样或按城市/时间范围切片。

计划输出文件包括：

```text
data/processed/overview_summary.json
data/processed/delivery_time_distribution.json
data/processed/distance_time_points.json
data/processed/time_series.json
data/processed/hour_condition_heatmap.json
data/processed/weather_traffic_summary.json
data/processed/courier_vehicle_summary.json
data/processed/city_summary.json
data/processed/detail_samples.json
```

## 10. 环境安装与运行方式

请先确认本地已安装 Node.js、npm 和 Python。

安装前端依赖：

```bash
npm install
```

运行数据预处理：

```bash
python scripts/preprocess.py
```

启动前端开发服务器：

```bash
npm run dev
```

构建前端：

```bash
npm run build
```

启动成功后，终端会显示本地访问地址，通常为：

```text
http://localhost:5173/
```

## 11. 使用流程

用户使用系统的基本流程如下：

1. 打开系统首页，查看整体订单数量、平均配送时长和延迟率。
2. 在配送时长分布视图中观察是否存在长尾延迟订单。
3. 在距离-时间散点图中分析距离与配送时长的关系。
4. 使用天气、交通、城市、车辆类型等筛选器缩小分析范围。
5. 在时间视图中查看午高峰、晚高峰和夜间的配送模式。
6. 在天气与交通视图中比较不同外部条件下的配送效率。
7. 在骑手与车辆视图中分析骑手评分、年龄、车辆类型和多单配送的影响。
8. 点击异常订单或高延迟条件组合，在详情面板中查看具体统计和样例记录。

## 12. Case Study 初稿

### Case Study 1：晚高峰高交通密度下的配送延迟

该案例计划展示 dinner_peak 和 high traffic 条件下的配送时效差异。用户可以筛选晚高峰和高交通密度订单，比较其平均配送时长和延迟率是否明显高于其他时段，并在距离-时间散点图中查看远距离订单是否更容易形成长尾延迟。

该案例可用于展示时间条件、交通状态和距离因素之间的联动分析。

### Case Study 2：恶劣天气对配送时效的影响

该案例可用于展示天气条件对配送时效的影响。用户可以比较 sunny、cloudy、rainy、stormy 等天气条件下的配送时长分布，观察恶劣天气是否导致平均配送时长上升或延迟订单比例增加。

后续实现中可以结合交通密度和城市维度进一步观察：在相同交通状态下，不同天气是否仍然带来明显的配送时长差异。

### Case Study 3：多单配送与骑手评分对配送表现的影响

该案例计划结合 `multiple_deliveries` 和 `Delivery_person_Ratings`，分析多单配送场景下，骑手评分较高的群体是否保持更稳定的配送时长。

该案例可用于展示骑手属性、配送方式和延迟风险之间的关系。

## 13. AI 使用说明

本项目允许使用大语言模型辅助代码生成、调试、README 初稿生成、可视化设计讨论和文档润色。核心分析任务、视图选择、多视图联动方式、case study 和最终设计决策由团队讨论确定。详细 AI 使用声明将在系统文档中说明。

## 14. 团队分工

- 成员 A：数据下载、字段解释、数据清洗和预处理脚本。
- 成员 B：前端框架、配送时长分布视图、距离-时间散点图实现。
- 成员 C：天气交通分析视图、骑手车辆分析视图、系统集成、文档与答辩材料。

## 15. 当前进度

- [ ] 确定最终使用的数据集
- [ ] 下载外卖配送原始数据
- [ ] 梳理字段含义和数据字典
- [ ] 编写数据预处理脚本
- [ ] 计算配送距离 `distance_km`
- [ ] 生成配送时长和延迟标签
- [ ] 生成前端所需聚合数据
- [ ] 实现 Overview Dashboard
- [ ] 实现 Delivery Time Distribution View
- [ ] 实现 Distance-Time Scatter View
- [ ] 实现 Temporal Pattern View
- [ ] 实现 Weather & Traffic Impact View
- [ ] 实现 Courier & Vehicle View
- [ ] 实现 Spatial / City View
- [ ] 完成多视图联动
- [ ] 编写 case study
- [ ] 录制 demo 视频
- [ ] 完成系统文档

## 16. 数据与使用声明

- 本项目代码和数据处理流程仅用于“数据可视化导论”课程学习、课程作业提交和教学展示。
- 数据来源为 Kaggle 公开数据集 Food Delivery Time。
- 项目使用的数据文件、字段映射、清洗规则和派生指标将在后续系统文档中进一步说明。
- 若前端演示使用抽样数据或城市子集，将在文档中明确抽样方式和筛选条件。
- 未经进一步确认，本项目不用于商业用途。
