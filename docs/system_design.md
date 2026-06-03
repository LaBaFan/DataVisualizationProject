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

当前前端主页是 **Delivery Operation Map / 外卖配送运行图**：

本系统主页采用 Delivery Operation Map 作为核心可视化入口。不同于传统 dashboard 中多个图表并列堆叠的形式，本设计将外卖配送城市运行图作为主背景，并通过 SVG 透明交互层把图中的餐厅、建筑、道路、天气区域、高风险场景和客户区域定义为独立模块。用户悬停模块时，系统显示轮廓、高亮遮罩和 tooltip；点击模块后，ETA Risk Ticket 展示该模块对应的订单数、平均配送时长、延迟率、平均距离、风险评分和解释文本，从而完成从风险总览到局部解释的可视分析流程。

- 极简 Header：背景图内部已包含 `DELIVERY OPERATION MAP / 外卖配送城市运行图` 主标题，页面外层只保留小号 FoodETA 和点击说明，避免重复标题。
- 背景图：`public/assets/delivery_city_map.png` 承担城市、餐厅、道路、骑手、天气区域和场景标签的视觉呈现。
- MapInteractionLayer：基于 `1600 x 1000` viewBox 渲染 SVG 透明热区，热区坐标集中在 `src/data/mapModules.ts`，用于后续按底图继续微调。
- Data Overlay Layers：在同一坐标系中叠加交通压力流量条、订单密度点、高风险脉冲圈和区域微型指标标签。它们不是独立图表，而是贴合道路、餐厅、客户区和风险区域的小型数据编码。
- MapTooltip：悬停时显示模块名称、类型和简要指标。
- ETA Risk Ticket：点击模块后以轻量浮层展示 details-on-demand。
- Scenario Analysis Drawer：在 ETA Risk Ticket 中点击“查看完整分析”后，从右侧打开深度解释层，保留地图上下文，同时展示完整场景分析。
- 路线层：当前不额外绘制跨越地图的装饰路线；道路模块默认透明，只在 hover 或 selected 时沿底图道路以细线高亮。

当前分析流程为：

```text
Delivery Operation Map 风险总览
  -> 点击模块定位场景
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

后续接入真实数据时，可用 `public/data/risk_scenario_summary.json`、`weather_traffic_summary.json`、`time_period_summary.json` 和 `scenario_orders_sample.json` 生成或覆盖 `mapModules.ts` 中的模块指标。

新增数据 overlay 集中在 `src/data/mapOverlayData.ts`：

- `trafficSegments`：沿底图道路放置 5-8 条短线段。颜色映射 `traffic_density`，线宽映射 `order_count`，透明度映射 `delay_rate`。
- `orderDots`：在餐厅、道路和客户区附近放置订单密度点。点大小映射 `order_count` 或 `delivery_duration_min`，颜色映射是否高延迟。
- `scenarioAnchors`：为高风险区域放置轻量脉冲圈。半径映射 `risk_score`，颜色映射 `delay_rate`。
- `miniMetricTags`：默认展示 Top 风险区域的小标签，只保留 `Delay` 和 `Avg` 等两个核心指标。

这些 overlay 元素均可 hover 和 click，并与 ETA Risk Ticket 复用同一 details-on-demand 交互。当前数据为前端 mock 配置，后续可由 processed JSON 自动生成同结构配置。

## 多视图联动

当前主页已实现围绕背景图热区的交互：

- hover 模块：显示半透明遮罩、类型颜色描边和跟随鼠标的 tooltip。
- click 模块：保持 selected 高亮，并打开 ETA Risk Ticket。
- hover/click 数据 overlay：交通线段、订单密度点、风险脉冲圈和微型指标标签均显示 tooltip；点击后更新 ETA Risk Ticket，展示对应的交通压力、订单量、配送时长、延迟率、风险评分或订单详情。
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
