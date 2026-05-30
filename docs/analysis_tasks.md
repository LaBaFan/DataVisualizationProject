# 分析任务定义

## T1 配送时间整体分布

任务目的：分析配送时长的中心趋势、离散程度和长尾延迟情况，判断整体配送效率是否稳定。

涉及字段：`delivery_duration_min`、`is_delayed`、`city`、`order_type`。

后续图表：直方图、箱线图、分位数摘要卡片。

可能 case study：识别配送时长超过 75 分位数的延迟订单，比较其在不同城市或订单类型中的占比。

可借鉴设计：可借鉴 TimeNotes 的时间注释思想，在后续时间趋势或分布联动中标注异常延迟时段，帮助解释长尾延迟出现的上下文。

## T2 配送距离与配送时间关系

任务目的：探索距离是否是配送时长增加的主要因素，并发现短距离长耗时或长距离高效率的异常样本。

涉及字段：`distance_km`、`delivery_duration_min`、`speed_kmph`、`traffic_density`、`weather`。

后续图表：距离-时间散点图、速度分布图、异常点详情面板。

可能 case study：筛选短距离但配送时长较高的样本，检查是否集中在高交通密度或恶劣天气条件下。

可借鉴设计：可与 LineUp 思想下的风险排序结果联动，用于解释高风险场景中的异常订单，例如短距离但高耗时的订单是否来自特定风险组合。

## T3 天气与交通对配送时效的影响

任务目的：比较不同天气和交通组合下的平均配送时长、延迟率和订单量，判断外部环境压力。

涉及字段：`weather`、`traffic_density`、`delivery_duration_min`、`is_delayed`。

后续图表：分组柱状图、热力矩阵、条件组合排行榜。

可能 case study：分析雨天与高交通密度组合是否显著提高配送时长和延迟率。

可借鉴设计：可借鉴 Parallel Sets 的类别路径关系表达，展示天气、交通密度、时段和延迟之间的组合路径。

## T4 不同时段配送效率差异

任务目的：分析早餐、午高峰、下午、晚高峰和夜间的订单量与配送效率差异。

涉及字段：`order_hour`、`weekday`、`time_period`、`delivery_duration_min`、`is_delayed`。

后续图表：小时折线图、时段柱状图、小时热力图。

可能 case study：比较午高峰和晚高峰的订单量、平均配送时长和延迟率，判断峰值时段压力。

可借鉴设计：可借鉴 TimeNotes，在时间趋势图中标注午高峰、晚高峰、订单量峰值和异常延迟峰值。

## T5 骑手属性与车辆类型影响

任务目的：分析骑手年龄、评分、车辆类型和多单配送对配送表现的影响。

涉及字段：`delivery_person_age`、`delivery_person_ratings`、`vehicle_type`、`multiple_deliveries`、`delivery_duration_min`。

后续图表：分组箱线图、评分分箱柱状图、车辆类型对比图。

可能 case study：观察多单配送条件下，不同车辆类型或评分区间的配送时长是否存在明显差异。

可借鉴设计：可借鉴 Parallel Sets，用于展示 `vehicle_type`、`multiple_deliveries` 和 `is_delayed` 之间的类别路径。

## T6 高延迟风险场景组合识别

任务目的：通过多字段组合发现延迟风险较高的典型场景，为后续交互筛选和故事化分析提供依据。

涉及字段：`time_period`、`weather`、`traffic_density`、`distance_km`、`multiple_deliveries`、`is_delayed`。

后续图表：组合条件排行榜、风险矩阵、联动筛选详情面板。

可能 case study：构造“晚高峰 + 高交通密度 + 恶劣天气 + 多单配送”的筛选条件，比较其延迟率与全局平均水平。

可借鉴设计：可借鉴 LineUp 的多属性排序思想，构建配送延迟风险排序视图，对条件组合进行可解释排序和比较。
