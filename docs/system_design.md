# 系统设计

## 系统架构

FoodETA 采用纯前端静态数据架构，最终版主流程是 **Overall + 六个 Weather Module**。系统不依赖数据库、鉴权或后端动态 API；所有分析数据由 Python 离线生成 JSON 后交给 React 前端读取。

- 前端：React + TypeScript + Vite，负责 Overall 页面、天气模块、交互地图、子视图图层和右侧 Analysis Panel。
- 数据处理：Python + pandas + numpy，负责从 `data/raw/food_delivery.csv` 生成清洗数据和聚合 JSON。
- 静态数据：前端读取 `public/data/*.json`；加载失败时使用小规模 mock fallback 保持页面可演示。
- 静态图片：运行时背景图集中在 `public/assets/backgrounds/`。

## 数据流

```text
data/raw/food_delivery.csv
  -> scripts/preprocess.py
  -> data/processed/orders_clean.csv
  -> data/processed/*.json
  -> scripts/sync_public_data.py
  -> public/data/*.json
  -> React fetch / staticDataClient
  -> Overall / Weather Module / Analysis Panel
```

数据处理流程：

1. 将 Kaggle 原始 CSV 放入 `data/raw/food_delivery.csv`。
2. 运行 `python3 scripts/preprocess.py`，生成清洗后的订单 CSV 和聚合 JSON。
3. 运行 `python3 scripts/sync_public_data.py`，把前端需要的 JSON 同步到 `public/data/`。
4. React 通过 `src/api/staticDataClient.ts` 读取静态 JSON。
5. `src/data/weatherSelectors.ts`、`src/data/weatherComparisonSelectors.ts` 和 `src/data/sceneMetrics.ts` 根据当前天气、时段、交通、车辆和子视图组织指标。

## 前端核心组件

- `FoodETAMapExplorer`：主页布局容器，组织左侧导航、中间地图和右侧 Analysis Panel。
- `SceneNavigation`：左侧模块导航，包含 Overall 与六个天气模块。
- `WeatherModuleStage`：根据当前模块在 Overall 与 Weather Detail 之间切换。
- `OverallModule`：展示总览地图、全局指标和天气入口。
- `WeatherDetailModule`：展示单一天气模块和六个子分析标签。
- `InteractiveSceneMap`：承载天气背景图、HUD、Overall 热区和天气子视图编码层。
- `WeatherSubViewPanel`：渲染 Overview、Traffic、Time、Vehicle、Risk、Orders 六个子分析视图。
- `DataOverviewPanel`：右侧分析面板，展示当前过滤条件、核心指标和解释文本。

## 页面结构

```text
Top TimeSelector
Left SceneNavigation | Center InteractiveSceneMap / WeatherSubViewPanel | Right Analysis Panel
```

用户默认进入 Overall。Overall 提供全局配送指标和天气地图入口；点击 Sunny、Fog、Stormy、Sandstorms、Cloudy 或 Windy 后进入对应 Weather Module。每个天气模块共享六个子视图：

```text
Overview -> Traffic -> Time -> Vehicle -> Risk -> Orders
```

## 状态管理

前端使用 `InteractionContext` 管理核心交互状态：

- `activeModule`：当前模块，取值为 `overall` 或六个天气模块。
- `selectedSceneId`：当前地图场景，与模块保持一致。
- `selectedWeather`：当前天气筛选。
- `selectedTimePeriod`：当前时段筛选。
- `selectedTrafficDensity`：当前交通密度筛选。
- `selectedVehicleType`：当前车辆类型筛选。
- `selectedSubView`：当前天气子视图。
- `selectedItem`：当前点击选中的地图热区、图层元素或订单样本。

## 数据文件

前端主要读取：

- `overview_summary.json`
- `weather_impact_summary.json`
- `weather_traffic_summary.json`
- `time_period_summary.json`
- `traffic_density_summary.json`
- `scene_summary.json`
- `scene_filter_summary.json`
- `risk_scenario_summary.json`
- `distance_time_sample.json`
- `scenario_distance_time_points.json`
- `scenario_orders_sample.json`

`scene_summary.json` 和 `scene_filter_summary.json` 只保留最终版 `overall`、`sunny`、`fog`、`stormy`、`sandstorms`、`cloudy`、`windy` 七类场景。Risk 子视图使用平均配送时长、延迟率、订单量等统计指标识别高延迟组合，不作为独立综合评分指标展示。

## 设计特点

1. 以天气作为主线，降低理解门槛，并自然连接交通、时段、车辆和订单异常。
2. 使用 Overall 页面做全局比较，再进入单一天气模块做局部解释。
3. 六个 Weather Module 共享同一套子视图结构，减少交互学习成本。
4. 右侧 Analysis Panel 用小票式表达把当前过滤条件、指标和解释放在一起。
5. 系统采用 storytelling 式探索链路，而不是把所有图表平铺成传统 dashboard。
