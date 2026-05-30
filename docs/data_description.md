# 数据说明

## 数据来源与规模

本项目使用 Kaggle 公开数据集 Food Delivery Dataset，下载地址为：https://www.kaggle.com/datasets/gauravmalik26/food-delivery-dataset。

公开资料显示，该数据集约包含 45,000 条外卖配送记录，每条记录对应一次配送样本，包含配送时间、餐厅位置、配送位置、天气、交通、订单类型、车辆类型和骑手属性等信息。该规模满足课程建议“不少于 1 万条记录”的要求，适合开展多视图可视分析。

原始数据不提交到仓库。使用者需自行下载并放置到 `data/raw/food_delivery.csv`。

## 原始字段说明

字段名称以实际 CSV 为准，当前处理脚本会在预处理阶段统一为 snake_case。主要原始字段如下：

- `ID`：订单或配送样本编号。
- `Delivery_person_ID`：配送员编号。
- `Delivery_person_Age`：配送员年龄。
- `Delivery_person_Ratings`：配送员评分。
- `Restaurant_latitude`：餐厅纬度。
- `Restaurant_longitude`：餐厅经度。
- `Delivery_location_latitude`：配送地点纬度。
- `Delivery_location_longitude`：配送地点经度。
- `Order_Date`：订单日期。
- `Time_Orderd`：下单时间，原始字段名保留拼写。
- `Time_Order_picked`：取餐时间。
- `Weatherconditions`：天气状况。
- `Road_traffic_density`：道路交通密度。
- `Vehicle_condition`：车辆状态。
- `Type_of_order`：订单类型。
- `Type_of_vehicle`：车辆类型。
- `multiple_deliveries`：多单配送数量或标记。
- `Festival`：是否节日。
- `City`：城市类型。
- `Time_taken(min)`：配送耗时，单位分钟。

## 字段分类

### 订单基础信息

- `ID`：订单或样本唯一标识。
- `Type_of_order`：订单类型，可用于比较不同订单类型下的配送表现。

### 配送员属性

- `Delivery_person_ID`：配送员标识。
- `Delivery_person_Age`：配送员年龄。
- `Delivery_person_Ratings`：配送员评分。

### 空间位置属性

- `Restaurant_latitude`、`Restaurant_longitude`：餐厅经纬度。
- `Delivery_location_latitude`、`Delivery_location_longitude`：配送目的地经纬度。
- `City`：城市类型或区域类别。

### 时间属性

- `Order_Date`：订单日期，可用于解析星期和日期趋势。
- `Time_Orderd`：下单时间，可用于提取订单小时。
- `Time_Order_picked`：取餐时间，当下单时间缺失时可作为小时解析的补充来源。

### 环境与交通属性

- `Weatherconditions`：天气状况。
- `Road_traffic_density`：道路交通密度。
- `Festival`：是否节日。

这些字段适合分析外部环境对配送时效的影响。

### 配送方式属性

- `Type_of_vehicle`：配送车辆类型。
- `multiple_deliveries`：是否存在多单配送。
- `Vehicle_condition`：车辆状态。

这些字段可用于比较不同车辆类型、车辆状态和多单配送方式下的效率差异。

### 配送结果变量

- `Time_taken(min)`：原始配送耗时，是本项目的核心分析目标字段。
- `delivery_duration_min`、`distance_km`、`is_delayed`、`speed_kmph`：预处理后生成的结果或派生分析变量。

## 数据适用性

该数据集同时包含时间、空间、环境、订单、车辆和骑手属性，能够支持配送时长分布、距离与时间关系、天气交通影响、时段差异、骑手车辆对比和高延迟场景识别等多个分析任务。由于字段维度较丰富，后续可以设计概览、分布、散点、时间、环境交通、骑手车辆和城市对比等多视图联动界面。
