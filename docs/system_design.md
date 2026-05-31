# 系统设计

## 系统架构

FoodETA 当前采用纯前端静态数据架构：

- 前端：React + TypeScript + Vite，负责 dashboard 布局、基础图表、筛选状态和空状态展示。
- 数据处理：Python + pandas + numpy，负责从 `data/raw/food_delivery.csv` 生成清洗数据和聚合 JSON。
- 数据文件：当前已提交 processed CSV/JSON，原始 Kaggle CSV 不提交。

当前阶段目标是“先跑起来”，因此不引入数据库、鉴权、复杂状态管理或生产级部署。

## 数据流

1. 用户从 Kaggle 下载 Food Delivery Dataset，并将原始 CSV 放入 `data/raw/food_delivery.csv`。
2. 运行 `python3 scripts/preprocess.py`（或按本地环境使用 `python scripts/preprocess.py`），生成 `orders_clean.csv` 和多个聚合 JSON。
3. React 前端通过 Vite 读取 `data/processed/` 下的静态 JSON。
4. 图表组件根据静态 JSON 渲染基础视图；缺失数据时显示 EmptyState。

## 前端视图

当前前端是单页 dashboard：

- Overview：展示总订单数、有效订单数、平均配送时长、延迟率、平均距离等指标。
- Delivery Time Distribution：展示配送时长分布。
- Distance-Time Scatter：展示距离与配送时长关系。
- Temporal Pattern：展示小时趋势。
- Weather & Traffic：展示天气交通组合。
- Courier & Vehicle：展示车辆和骑手相关统计。
- City Comparison：展示城市维度对比。
- Delivery Risk Ranking View：借鉴 LineUp 的风险排序占位视图。
- Delay Factor Flow View：借鉴 Parallel Sets 的路径关系占位视图。
- Annotated Temporal View：借鉴 TimeNotes 的时间注释占位视图。

左侧 `FilterPanel` 维护全局筛选状态，右侧 `DetailPanel` 预留 details-on-demand 信息。当前筛选状态已经有 Context，但大多数图表尚未按筛选条件真实过滤。

## 静态数据模块

前端数据读取集中在 `src/data/client.ts`。该文件通过 `import.meta.glob` 收集 `data/processed/*.json`，并向各视图提供统一的数据读取函数，例如 overview、配送时长分布、天气交通统计、风险场景、因素流和时间注释。当前基础版风险场景、因素流和时间注释文件均已由预处理脚本生成。

## 多视图联动

当前版本只实现了全局筛选状态和布局占位，后续联动计划包括：

- 左侧筛选器控制所有视图的数据范围；
- 散点图 brushing 后联动详情面板和其他统计视图；
- 点击城市、天气、交通或车辆类别后更新风险排序和路径图；
- 高延迟订单在多个视图中同步高亮；
- 右侧详情面板展示选中条件组合的局部统计和样本订单。

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
