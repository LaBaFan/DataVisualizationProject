# 系统设计

## 系统架构

FoodETA 当前采用纯前端静态数据架构：

- 前端：React + TypeScript + Vite，负责 Delivery Operation Map 布局、背景图叠加 SVG 交互层和 details-on-demand 展示。
- 数据处理：Python + pandas + numpy，负责从 `data/raw/food_delivery.csv` 生成清洗数据和聚合 JSON。
- 数据文件：当前已提交 processed CSV/JSON，原始 Kaggle CSV 不提交。

当前阶段目标是“先跑起来”，因此不引入数据库、鉴权、复杂状态管理或生产级部署。

## 数据流

1. 用户从 Kaggle 下载 Food Delivery Dataset，并将原始 CSV 放入 `data/raw/food_delivery.csv`。
2. 运行 `python3 scripts/preprocess.py`（或按本地环境使用 `python scripts/preprocess.py`），生成 `orders_clean.csv` 和多个聚合 JSON。
3. React 前端通过 Vite 静态资源路径读取 `public/data/` 下的 JSON。
4. Delivery Operation Map 当前使用 `src/data/mapModules.ts` 的 mock 模块数据渲染交互热区；后续可将静态 JSON 聚合结果接入模块配置。

## 前端视图

当前前端主页升级为 **scrollytelling 式 Delivery Operation Map / 外卖配送风险分析界面**：

本系统主页采用滚动叙事结构组织 Delivery Operation Map。不同于传统 dashboard 中多个图表并列堆叠的形式，本设计将外卖配送城市运行图作为第一屏风险总览入口，并在其后通过滚动 section 依次展开天气影响、交通压力、配送时间节奏、高风险场景解释和异常订单分析。页面左侧固定 Weather Panel，顶部固定 Time Selector，右侧固定 Data Overview，中间为可滚动分析内容。用户可以先在城市运行图中发现风险，再通过滚动进入不同分析主题，形成“总览 -> 筛选 -> 局部解释 -> 订单详情”的 details-on-demand 流程。

- Top Time Selector：固定在页面顶部，用于选择 All、Morning、Noon、Afternoon、Evening、Night 等时段。
- Left Weather Panel：固定在页面左侧，用于选择 All、Sunny、Fog、Cloudy、Stormy、Sandstorms、Windy 等天气条件。
- Right Data Overview：固定在页面右侧，根据当前 active section、天气筛选、时间筛选和选中对象展示当前指标与解释。
- Scrolling Sections：中间主区域包含 6 个 section，每个 section 聚焦一个分析问题。
- Operation Overview：以 `public/assets/delivery_city_map.png` 为背景图，叠加 SVG 透明热区、交通压力线段、订单密度点、高风险脉冲圈和微型指标标签。
- Weather Impact：Weather Risk Ranking 天气风险横向排行，条长表示风险评分，辅助显示订单量、平均配送时长和延迟率。
- Traffic Pressure：Traffic Pressure Bands / 交通压力分层带图，条带长度表示 `order_count`，颜色表示 `delay_rate`，厚度表示平均配送时长，并用小点提示订单密度。
- Time Rhythm：Morning -> Noon -> Afternoon -> Evening -> Night 的时间带，宽度表示订单量，颜色表示延迟率，高度/亮度表示平均配送时长。
- Risk Scenario Explain：风险场景气泡图 + 右侧解释面板 + 底部 Top 5，展示天气、交通、时段和车辆类型如何叠加成延迟风险。
- Outlier Orders：距离-配送时长散点图，定位短距离长时长或高延迟订单，并显示平均线与 32 分钟阈值线。

当前分析流程为：

```text
Weather / Time 筛选
  -> 地图图层、section 视图和 Data Overview 联动更新
滚动进入不同 section
  -> activeSection 更新右侧解释
点击地图或 section 元素
  -> 选中对象并显示 ETA Risk Ticket 信息
ETA Risk Ticket 简要预览
  -> 查看完整分析
Scenario Analysis Drawer 深度解释
```

Scenario Analysis Drawer 包含五个区块：

- 场景概览：模块标签、条件标签、订单数、平均配送时长、延迟率、平均距离和风险评分。
- 与全局平均对比：用水平对比条比较平均配送时长、延迟率和平均距离。
- 距离-配送时长散点图：横轴为 `distance_km`，纵轴为 `delivery_duration_min`，颜色区分是否延迟，并标注全局平均线和当前场景平均线。
- 风险因素拆解：围绕 `traffic_density`、`time_period`、`weather` 和 `vehicle_type` 展示简短解释与贡献条。
- 样例订单表：展示 5-10 条代表订单，点击订单后在 Drawer 内显示订单详情。

## 静态数据模块

主页当前交互模块集中在 `src/data/mapModules.ts`，不依赖后端、数据库或动态 API。每个 `MapModule` 包含模块类型、形状、坐标、场景字段和 mock 指标：

- `shape` / `coords`：定义 SVG 热区，坐标统一使用 `1600 x 1000` viewBox。
- `type`：区分 restaurant、building、road、weather、risk_zone、customer_area、order_point 和 rider。
- `weather`、`traffic_density`、`time_period`、`vehicle_type`：描述模块对应的配送条件。
- `order_count`、`avg_delivery_duration_min`、`delay_rate`、`avg_distance_km`、`risk_score`：展示在 tooltip 和 ETA Risk Ticket 中。

后续接入真实数据时，可用 `public/data/overview_summary.json`、`weather_impact_summary.json`、`time_period_summary.json`、`traffic_segment_summary.json`、`risk_scenario_summary.json`、`distance_time_sample.json` 和 `scenario_orders_sample.json` 生成或覆盖前端视图指标。

新增数据 overlay 集中在 `src/data/mapOverlayData.ts`：

- `trafficSegments`：沿底图道路中心线放置短路段，使用 polyline 表达。颜色映射 `traffic_density`，线宽映射 `order_count`，透明度/发光映射 `delay_rate`。
- `roadPressureNodes`：放置在真实路口、汇入口、餐厅出入口与客户区入口的道路节点，和短路段共享同一 ETA Risk Ticket 交互。
- `orderDots`：在餐厅、道路和客户区附近放置订单密度点。点大小映射 `order_count` 或 `delivery_duration_min`，颜色映射是否高延迟。
- `scenarioAnchors`：为高风险区域放置轻量脉冲圈。半径映射 `risk_score`，颜色映射 `delay_rate`。
- `miniMetricTags`：默认展示 Top 风险区域的小标签，只保留 `Delay` 和 `Avg` 等两个核心指标。

这些 overlay 元素均可 hover 和 click，并与 ETA Risk Ticket 复用同一 details-on-demand 交互。当前数据为前端 mock 配置，后续可由 processed JSON 自动生成同结构配置。

## 状态管理与滚动检测

前端使用 `InteractionContext` 统一管理 scrollytelling 交互状态：

- `selectedWeather`：当前天气筛选，默认为 `All`。
- `selectedTimePeriod`：当前时段筛选，默认为 `All`。
- `activeSection`：当前滚动 section，可取 `overview`、`weather`、`traffic`、`time`、`risk`、`outlier`。
- `selectedItem`：当前点击选中的地图模块、交通线段、订单点、风险脉冲、微型指标标签，或交通压力分层带。
- `selectedScenarioId` / `selectedOrderId`：当前选中场景或订单。

Scrollytelling 结构由四个核心组件组织：

- `WeatherPanel`：左侧固定天气筛选，负责更新 `selectedWeather`。
- `TimeSelector`：顶部固定时段筛选，负责更新 `selectedTimePeriod`。
- `ScrollStoryContainer`：中间滚动容器，组织 6 个分析 section，并检测当前 `activeSection`。
- `DataOverviewPanel`：右侧固定数据总览，根据 active section、筛选条件和选中对象切换语境。

`ScrollStoryContainer` 使用 `IntersectionObserver` 监听 section 进入视口的比例。当某个 section 进入视口中部时，系统更新 `activeSection`，右侧 Data Overview 随即切换标题、分析问题、指标上下文和解释文字。该机制使页面滚动本身成为分析流程的一部分，而不是简单的长页面堆叠。

`ScrollProgress` 的导航点击采用 `smooth scroll`。点击 Map、Weather、Traffic、Time、Risk 或 Orders 时，系统会先立即设置目标 `activeSection`，再执行平滑滚动，并在短时间内避免 IntersectionObserver 抢回上一个 section。这样右侧 Data Overview 能和用户点击意图保持同步，减少 section 边界处的状态抖动。

`DataOverviewPanel` 的展示规则如下：

- 当没有选中地图元素时，根据 `activeSection` 展示当前分析主题的问题、摘要指标和解释。
- 当选择天气或时间后，指标切换为筛选后的订单量、平均配送时长、延迟率、典型交通或高风险组合。
- 当点击地图模块、交通路段、道路节点、订单点、风险脉冲、微型标签或交通压力分层带后，面板切换为 ETA Risk Ticket 语境，展示该对象的订单数、平均配送时长、延迟率、平均距离、风险评分和完整分析入口。

6 个 section 的分析任务与视图形式如下：

- Operation Overview：回答“当前配送运行状态在哪里出现风险”。视图为 Delivery Operation Map，叠加热区、交通线段、订单点、风险脉冲和微型指标标签。
- Weather Impact：回答“不同天气下配送是否变慢”。视图为天气风险横向排行，条长表示 `risk_score`，辅助显示 `order_count`、`avg_delivery_duration_min` 和 `delay_rate`。
- Traffic Pressure：回答“拥堵是否造成配送延迟”。视图为 Traffic Pressure Bands，条带长度表示 `order_count`，颜色表示 `delay_rate`，厚度表示平均配送时长，小点提示订单密度。
- Time Rhythm：回答“早、中、晚、夜间的配送压力如何变化”。视图为时间带，宽度表示订单量，颜色表示延迟率，高度/亮度表示平均配送时长，并标注 Lunch Rush、Dinner Rush、Night Risk、Peak Orders 和 Peak Delay。
- Risk Scenario Explain：回答“哪些条件组合最容易延迟”。视图为风险场景气泡图，横轴为 `avg_delivery_duration_min`，纵轴为 `delay_rate`，气泡大小表示 `order_count`，颜色表示 `risk_score`，边框样式区分车辆类型，底部仅保留 Top 5 简表。
- Outlier Orders：回答“哪些订单是异常配送”。视图为距离-配送时长散点图，横轴为 `distance_km`，纵轴为 `delivery_duration_min`，颜色区分是否延迟，点大小映射配送时长。

## 多视图联动

当前主页已实现围绕背景图热区的交互：

- hover 模块：显示半透明遮罩、类型颜色描边和跟随鼠标的 tooltip。
- click 模块：保持 selected 高亮，并打开 ETA Risk Ticket。
- hover/click 数据 overlay：交通短路段、道路节点、订单密度点、风险脉冲圈和微型指标标签均显示 tooltip；点击后更新 ETA Risk Ticket，展示对应的道路状态、订单量、配送时长、延迟率、风险评分或订单详情。
- click 天气筛选：Weather Panel 高亮当前天气；地图中的相关天气区域、风险脉冲、订单点和微型标签保持突出，不相关元素降低透明度；Weather Impact 排行同步高亮；Data Overview 切换到天气统计语境。
- click 时间筛选：Time Selector 高亮当前时段；地图整体色调、交通线段亮度/线宽和订单点缩放发生变化；Time Rhythm 时间带同步高亮；Data Overview 切换到时间统计语境。
- scroll section：`activeSection` 更新，右侧 Data Overview 的标题、解释和指标上下文随 section 改变。
- click “查看完整分析”：打开 Scenario Analysis Drawer，展示场景概览、全局对比、散点图、因素解释、样例订单表和订单详情。
- click 空白区域或 ticket 关闭按钮：在 Drawer 未打开时取消选中并隐藏详情浮层；Drawer 打开后由自身关闭按钮控制关闭，避免误操作。
- 模块配置与坐标集中维护在 `src/data/mapModules.ts`，避免坐标散落在 JSX 中。

## 经典设计参考

- LineUp：借鉴多属性排序与比较思想，用于 Delivery Risk Ranking View。
- Parallel Sets：借鉴多类别变量路径与组合关系表达，用于 Delay Factor Flow View。
- TimeNotes：借鉴时间序列事件注释思想，用于 Annotated Temporal View。

这些设计只作为视图思想来源，当前系统不会直接复用现有系统或简单换数据。

## 团队设计贡献

1. 将外卖配送订单从单条记录提升为“条件组合风险场景”。
2. 围绕“发现问题 → 定位异常 → 解释原因 → 排序比较”组织多视图流程。
3. 将配送时间、距离、天气、交通、时段、骑手和车辆因素组合到统一的延迟风险分析框架中。
4. 将经典设计思想适配到外卖配送数据，而不是简单替换数据源。
