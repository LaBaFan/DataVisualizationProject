# 系统设计

## 系统架构

FoodETA 当前采用纯前端静态数据架构，主页主流程是 **Overall Map Explorer / 总入口地图式可视分析界面**，不再以 scrollytelling 的 WeatherPanel + ScrollProgress + 6 个滚动 section 作为当前主页主体。

- 前端：React + TypeScript + Vite，负责总入口地图、子场景地图、SVG 热区、数据 overlay、HUD 和右侧分析面板。
- 数据处理：Python + pandas + numpy，负责从 `data/raw/food_delivery.csv` 生成清洗数据和聚合 JSON。
- 静态数据：前端优先读取 `public/data/*.json`；加载失败时使用内置 mock 作为 fallback。
- 静态图片：页面使用 `public/assets/maps/` 下的地图图片；源图集中在 `source_assets/maps/`。

项目不引入数据库、鉴权、后端动态 API 或复杂状态管理。

## 数据流

```text
data/raw/food_delivery.csv
  -> scripts/preprocess.py
  -> data/processed/orders_clean.csv
  -> data/processed/*.json
  -> scripts/sync_public_data.py
  -> public/data/*.json
  -> React fetch / staticDataClient
  -> scene metrics / HUD / DataOverviewPanel / analysis views
```

数据处理流程说明：

1. 用户将 Kaggle 原始 CSV 放入 `data/raw/food_delivery.csv`。
2. 运行 `python3 scripts/preprocess.py`，生成清洗后的订单 CSV 和聚合 JSON。
3. 运行 `python3 scripts/sync_public_data.py`，把前端需要的 JSON 同步到 `public/data/`。
4. React 通过 `src/api/staticDataClient.ts` 读取静态 JSON。
5. `src/data/sceneMetrics.ts` 根据当前 scene、天气、时段和选中对象选择合适的 summary 来源，供地图 HUD 和右侧面板使用。

当前已生成并同步的关键数据包括：

- `overview_summary.json`
- `weather_impact_summary.json`
- `traffic_density_summary.json`
- `scene_summary.json`
- `scene_filter_summary.json`
- `risk_scenario_summary.json`
- `scenario_orders_sample.json`
- `scenario_distance_time_points.json`
- `distance_time_sample.json`

## 前端核心组件

当前主页由以下组件组织：

- `FoodETAMapExplorer`：主页布局容器，组织左侧导航、中间地图和右侧分析面板。
- `SceneNavigation`：左侧场景导航，包含总览、天气模块和区域模块；切换时更新 `selectedSceneId`，并按 scene 类型同步天气、时段或 activeSection 语境。
- `InteractiveSceneMap`：中间地图视图，根据当前 scene 渲染背景图、HUD、overall 热区和子场景 overlay。
- `OverallHotspotLayer`：overall 总入口地图上的 SVG 热区层，提供至少 8 个入口热区。
- `DataOverviewPanel`：右侧 Analysis Panel，根据当前 scene、筛选条件和选中对象展示指标、解释和 ETA Risk Ticket。
- `TimeSelector`：顶部时间筛选器，更新当前时段语境。

辅助图层包括地图交互层、订单密度点、交通压力线、风险 halo、脉冲圈、微型指标标签和配送流粒子等。它们负责可视表达和点击对象选择，但 HUD 聚合值不再由这些 overlay mock 求和得到。

## 页面结构

```text
Top TimeSelector
Left SceneNavigation | Center InteractiveSceneMap | Right DataOverviewPanel
```

用户默认进入 `overall` scene。overall 地图提供总入口热区，用户可点击进入天气、交通、区域或风险子场景；也可以直接通过左侧 `SceneNavigation` 切换。右侧 `DataOverviewPanel` 始终显示当前场景和筛选条件下最相关的订单量、平均配送时长、延迟率、平均距离和风险指标。

旧版 `ScrollStoryContainer`、`WeatherPanel`、`ScrollProgress` 和 6 个滚动 section 可保留为历史组件或完整分析入口，但不作为当前主页主流程。`activeSection` 因此仍可存在，用于兼容旧分析视图、右侧面板语境和从地图进入完整分析时的定位。

## 状态管理

前端使用 `InteractionContext` 管理核心交互状态：

- `selectedSceneId`：当前地图 scene，默认 `overall`。
- `selectedWeather`：当前天气筛选，默认 `All`。
- `selectedTimePeriod`：当前时段筛选，默认 `All`。
- `selectedItem`：当前点击选中的地图热区、场景元素、overlay、风险对象或订单对象。
- `activeSection`：保留给旧分析 section、完整分析入口和右侧面板语境。

典型状态变化：

- 点击 overall 热区：更新 `selectedSceneId`，并按目标 scene 类型设置对应 `activeSection`。
- 点击左侧场景导航：更新 `selectedSceneId`，天气类 scene 会同步 `selectedWeather`，夜间类 scene 会同步 `selectedTimePeriod`。
- 点击时间选择器：更新 `selectedTimePeriod`，影响地图色调、overlay 强调和 HUD context。
- 点击地图或 overlay 元素：更新 `selectedItem`，右侧面板进入 ETA Risk Ticket 语境。

## HUD 数据语义

HUD 和右侧指标已从“overlay mock 求和”修正为“按语义选择真实 summary 来源”：

- overall：优先使用 `overview_summary.json` 的全局指标。
- weather：优先使用 `weather_impact_summary.json` 中对应天气的聚合指标。
- time：优先使用 `time_period_summary.json` 中对应时段的聚合指标。
- traffic：优先使用 `traffic_density_summary.json` 中 High/Jam 等交通压力聚合。
- area / scene：优先使用 `scene_filter_summary.json` 中 scene、weather 和 time_period 的交叉聚合；无筛选时回到 `scene_summary.json` 中对应 scene 的聚合指标。
- risk：优先使用 `risk_scenario_summary.json`、`scenario_orders_sample.json` 和 `scenario_distance_time_points.json` 支撑风险解释和样本展示。

当某个 summary 不存在或加载失败时，前端才回退到内置 mock fallback。该 fallback 用于保持演示可用，不应在文档或报告中当作真实统计结果。

## scene_summary proxy 规则

`scene_summary.json` 面向地图 scene 提供聚合指标。天气类和时间类 scene 可以直接按字段过滤；区域类 scene 没有真实 GIS 边界，因此使用真实订单字段构造业务 proxy。当前规则语义如下：

- `overall`：全量清洗订单。
- `sunny`、`cloudy`、`fog_business`、`storm_area`、`sandstorm`、`windy`：按 `weather` 过滤，其中 fog/storm/sandstorm/windy 等 scene 与相应天气条件对应。
- `night_low_peak`：按 `time_period = night` 聚合。
- `traffic_hub`：按高交通压力聚合，重点覆盖 `traffic_density = High` 或 `traffic_density = Jam`。
- `restaurant_street`：基于真实订单中的业务规则 proxy，表达餐厅密集或餐饮街区语境，不代表真实街区边界。
- `dispatch_center`：基于真实订单中的业务规则 proxy，表达调度中心或配送组织压力语境。
- `high_risk_residential`：基于真实订单中的高风险组合 proxy，表达高延迟居住区配送语境。
- `mixed_food_community`：基于真实订单中的混合餐饮/社区配送 proxy，表达复合场景语境。

这些 proxy 使用真实订单记录聚合得到，但不是 GIS 空间分析结果，也不应解释为真实地理区域统计。

## 多视图交互

当前多视图联动围绕 scene explorer 展开：

- overall 热区进入子模块：用户在总入口地图点击天气、交通、区域或风险入口后，进入对应子场景。
- 左侧导航切换模块：用户可直接从 SceneNavigation 切换总览、天气模块和区域模块。
- hover tooltip：地图热区、overlay 和风险元素在 hover 时展示场景名称、订单量、平均配送时长、延迟率等简要信息。
- click ETA Risk Ticket：点击具体元素后，右侧 DataOverviewPanel 切换为选中对象的风险票据，展示关键指标和解释。
- 时间筛选影响 overlay/HUD context：`selectedTimePeriod` 会改变地图视觉语境、overlay 强调方式和 HUD 指标来源。
- 天气筛选影响天气 scene 和相关 overlay：天气类 scene 会同步 `selectedWeather`，并让对应天气相关元素保持突出。
- 完整分析入口：从 ETA Risk Ticket 可进入旧分析 section 或详细分析视图，`activeSection` 用于定位分析主题。

## 静态资源与地图场景

运行时地图图片位于：

```text
public/assets/maps/
```

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

overall 使用 SVG 热区作为入口；子模块使用对应背景图和 overlay 表达场景内风险。后续调整坐标时，应优先修改前端场景配置和 overlay 配置，而不是在 JSX 中散落硬编码坐标。

## 旧分析组件定位

旧的滚动式分析组件仍有复用价值：

- Weather Impact：展示天气风险排行。
- Traffic Pressure：展示交通压力分层。
- Time Rhythm：展示时段节奏。
- Risk Scenario Explain：展示风险组合解释。
- Outlier Orders：展示距离-配送时长异常订单。

这些视图可作为 scene explorer 的下钻分析或历史模块存在，但当前首页首屏和主流程是 Overall Map Explorer。

## 经典设计参考

- LineUp：借鉴多属性排序与比较思想，用于风险排行和场景比较。
- Parallel Sets：借鉴多类别变量路径与组合关系表达，用于延迟因素组合分析。
- TimeNotes：借鉴时间序列事件注释思想，用于时段趋势解释。

这些设计只作为视图思想来源，当前系统不会直接复用现有系统或简单替换数据源。

## 团队设计贡献

1. 将外卖配送订单从单条记录提升为“场景化风险入口”和“条件组合风险解释”。
2. 使用 overall 总入口地图组织天气、交通、区域和风险子模块。
3. 将真实聚合 JSON 接入前端静态数据流，优先展示真实统计，mock 仅作加载失败 fallback。
4. 将配送时间、距离、天气、交通、时段、骑手和车辆因素组合到统一的延迟风险分析框架中。
