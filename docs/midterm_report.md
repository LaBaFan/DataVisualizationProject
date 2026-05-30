# FoodETA 中期报告

## 项目背景

FoodETA 面向外卖配送时效与延迟因素分析，目标是在课程项目中构建一个可运行的可视分析系统基础框架。当前阶段重点不是完整实现复杂交互，而是完成数据处理、分析任务定义、前后端基础骨架和后续系统设计规划。

## 数据来源

项目使用 Kaggle 公开数据集 Food Delivery Dataset：  
https://www.kaggle.com/datasets/gauravmalik26/food-delivery-dataset

该数据集约包含 45,000 条配送记录，字段覆盖配送员信息、餐厅与配送地点经纬度、订单时间、取餐时间、天气、交通密度、车辆类型、城市类型、多单配送、节日标记和配送时长。原始 CSV 不提交到仓库，处理后数据保存在 `data/processed/`。

## 数据字段

主要字段包括 `ID`、`Delivery_person_ID`、`Delivery_person_Age`、`Delivery_person_Ratings`、餐厅与配送地点经纬度、`Order_Date`、`Time_Orderd`、`Time_Order_picked`、`Weatherconditions`、`Road_traffic_density`、`Vehicle_condition`、`Type_of_order`、`Type_of_vehicle`、`multiple_deliveries`、`Festival`、`City` 和 `Time_taken(min)`。

字段可分为订单基础信息、配送员属性、空间位置属性、时间属性、环境与交通属性、配送方式属性和配送结果变量。

## 当前数据处理方案

`scripts/preprocess.py` 负责读取 `data/raw/food_delivery.csv`，统一字段名，解析配送时长，计算 Haversine 距离，生成 `order_hour`、`weekday`、`time_period`、`is_delayed` 和 `speed_kmph`，并输出清洗数据和聚合 JSON。

当前已生成 `orders_clean.csv`、概览、配送时长分布、距离-时长采样、小时摘要、天气交通摘要、骑手车辆摘要和城市摘要等 processed 文件。后续会补充风险场景、因素流和时间注释三个专用聚合文件。

## 初步系统框架

当前系统包含：

- React + TypeScript + Vite 前端 dashboard 骨架；
- FastAPI 后端接口骨架；
- Python 数据预处理脚本；
- processed JSON 静态数据；
- README 和 docs 文档。

前端可直接读取静态 processed JSON，也可以请求后端 `/api/*` 接口。后端读取本地 JSON 文件，不使用数据库。

## 初步可视化设计

当前前端包含 Overview、配送时长分布、距离-时长散点、时间趋势、天气交通、骑手车辆、城市对比、配送风险排序、延迟因素流和带注释时间趋势等视图。基础视图已有简单图表，高级视图当前为占位或派生展示，后续补充完整交互。

## 经典设计借鉴

系统设计参考三类经典思想：

- LineUp：用于配送延迟风险排序，将条件组合定义为风险场景并按多指标排序；
- Parallel Sets：用于天气、交通、时段、车辆、多单配送和延迟结果之间的路径关系表达；
- TimeNotes：用于在时间趋势中标注午高峰、晚高峰、订单量峰值和延迟率峰值。

团队贡献在于将这些设计思想适配到外卖配送数据，围绕延迟风险场景识别组织多视图分析流程，而不是简单复用已有系统。

## 当前进展

当前已完成数据处理脚本、处理后数据、FastAPI 基础接口、React dashboard 骨架、基础图表和主要文档。系统可以启动前端和后端，但完整筛选联动、复杂交互和高级视图仍属于后续工作。

## 后续工作

后续需要补充：

- `risk_scenario_summary.json`
- `delay_factor_flow.json`
- `time_annotations.json`
- 筛选器与图表联动；
- 散点图 brushing；
- 详情面板；
- case study 展示。

## 三人分工

成员 A：数据处理与字段解释。负责下载 Kaggle 数据、梳理字段含义、编写 `preprocess.py`、计算 `distance_km`、`time_period`、`is_delayed`、`speed_kmph`，生成 processed 数据，并在中期答辩中主讲数据来源和预处理流程。

成员 B：前端可视化与交互框架。负责搭建 React + TypeScript + Vite 前端，实现 Overview、配送时长分布、距离-时长散点、时间趋势、FilterPanel 和图表占位联动，并在中期答辩中主讲视图设计和交互逻辑。

成员 C：后端 API、系统规划与文档。负责搭建 FastAPI 后端，实现 processed JSON 读取接口，整理 README 和 docs 文档，并在中期答辩中主讲系统框架、设计借鉴与后续工作。
