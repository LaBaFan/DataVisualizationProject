# 分析任务定义

## T1 配送时间整体分布

任务目的：分析配送时长的中心趋势、离散程度和长尾延迟情况，判断整体配送效率是否稳定。

涉及字段：`delivery_duration_min`、`is_delayed`、`order_type`、`city`。

后续图表：直方图、箱线图、分位数摘要卡片。

可能 case study：识别配送时长超过全局 75 分位数的订单，观察长尾延迟是否集中在特定订单类型或城市类型。

## T2 配送距离与配送时间关系

任务目的：探索配送距离与配送时长之间的关系，并发现短距离长耗时或长距离高效率的异常样本。

涉及字段：`distance_km`、`delivery_duration_min`、`speed_kmph`、`traffic_density`、`weather`。

后续图表：距离-时间散点图、速度分布图、异常点详情面板。

可能 case study：筛选短距离但配送时长较高的样本，检查是否集中在高交通密度或恶劣天气条件下。

## T3 天气与交通影响

任务目的：比较不同天气和交通组合下的平均配送时长、延迟率和订单量，判断外部环境压力。

涉及字段：`weather`、`traffic_density`、`delivery_duration_min`、`is_delayed`。

后续图表：分组柱状图、热力矩阵、条件组合排行榜。

可能 case study：分析雨天与高交通密度组合是否显著提高配送时长和延迟率。

## T4 不同时段效率差异

任务目的：分析早餐、午高峰、下午、晚高峰和夜间的订单量与配送效率差异。

涉及字段：`order_hour`、`weekday`、`time_period`、`delivery_duration_min`、`is_delayed`。

后续图表：小时折线图、时段柱状图、小时热力图。

可能 case study：比较午高峰和晚高峰的订单量、平均配送时长和延迟率，判断峰值时段压力。

## T5 骑手属性与车辆类型影响

任务目的：分析骑手年龄、评分、车辆类型和多单配送对配送表现的影响。

涉及字段：`delivery_person_age`、`delivery_person_ratings`、`vehicle_type`、`multiple_deliveries`、`delivery_duration_min`。

后续图表：分组箱线图、评分分箱柱状图、车辆类型对比图。

可能 case study：观察多单配送条件下，不同车辆类型或评分区间的配送时长是否存在明显差异。

## T6 同距离条件下的相对延迟分析

任务目的：在相近配送距离条件下比较订单是否相对更慢，避免只用全局配送时长阈值造成远距离订单天然更容易被判为延迟。

涉及字段：`distance_km`、`delivery_duration_min`、`is_delayed`、`weather`、`traffic_density`、`time_period`。

后续图表：距离分箱延迟率图、同距离箱内箱线图、相对延迟散点高亮、分箱摘要卡片。

可能 case study：按距离区间计算 75 分位数阈值，识别“同距离范围内明显更慢”的订单，再检查其天气、交通和时段条件。

## T7 高延迟风险场景排序与解释

任务目的：将天气、交通密度、时段、距离区间、车辆类型、多单配送等条件组合成配送场景，构建可解释风险评分，定位最值得关注的高风险场景。

涉及字段：`weather`、`traffic_density`、`time_period`、`distance_km`、`vehicle_type`、`multiple_deliveries`、`delivery_duration_min`、`is_delayed`。

后续图表：风险场景排序表、多指标条形编码、权重调节控件、场景对比详情面板。

可能 case study：比较“晚高峰 + 高交通密度 + 远距离 + 多单配送”和“普通时段 + 低交通密度 + 近距离”的订单量、平均配送时长、延迟率、平均距离和多单比例。

可借鉴设计：明确对应 LineUp 的多属性排序与对比思想，用风险分数、延迟率、平均时长等指标支持可解释排序。

## T8 配送条件路径与延迟结果流向分析

任务目的：将配送条件建模为类别路径，分析不同条件组合最终流向延迟或非延迟结果的比例差异。

涉及字段：`weather`、`traffic_density`、`time_period`、`vehicle_type`、`multiple_deliveries`、`is_delayed`、`order_count`。

后续图表：Parallel Sets、Sankey 流向图、路径高亮、路径详情面板。

可能 case study：比较 `weather -> traffic_density -> time_period -> is_delayed` 与 `vehicle_type -> multiple_deliveries -> is_delayed` 两类路径，识别订单量不大但延迟率突出的路径。

可借鉴设计：明确对应 Parallel Sets / Sankey，比普通热力图更强调多类别条件组合与结果流向。
