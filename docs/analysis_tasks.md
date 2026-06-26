# 分析任务定义

## T1 Overall 总览

任务目的：查看有效订单数、平均配送时长、延迟阈值、整体延迟率和平均配送距离，建立全局基线。

涉及字段：`delivery_duration_min`、`distance_km`、`is_delayed`、`weather`。

## T2 Weather Comparison

任务目的：比较 Sunny、Fog、Stormy、Sandstorms、Cloudy、Windy 六种天气下的订单量、平均配送时长和延迟率。

涉及字段：`weather`、`delivery_duration_min`、`is_delayed`、`distance_km`。

## T3 Traffic 子视图

任务目的：在单一天气模块内比较 Low、Medium、High、Jam 等交通密度对 ETA 的影响。

涉及字段：`weather`、`traffic_density`、`delivery_duration_min`、`is_delayed`。

## T4 Time 子视图

任务目的：比较早餐、午高峰、下午、晚高峰和夜间的配送表现，观察时段节奏。

涉及字段：`time_period`、`order_hour`、`delivery_duration_min`、`is_delayed`。

## T5 Vehicle 子视图

任务目的：比较不同车辆类型在当前天气下的订单量、平均配送时长和延迟率。

涉及字段：`vehicle_type`、`weather`、`delivery_duration_min`、`is_delayed`。

## T6 Risk 子视图

任务目的：基于平均配送时长、延迟率和订单量识别高延迟条件组合。该视图不引入单独的综合评分作为展示指标。

涉及字段：`weather`、`traffic_density`、`time_period`、`vehicle_type`、`delivery_duration_min`、`is_delayed`。

## T7 Orders 子视图

任务目的：通过订单级距离-配送时长散点发现短距离长耗时、长距离高耗时等异常样本。

涉及字段：`distance_km`、`delivery_duration_min`、`weather`、`traffic_density`、`time_period`、`vehicle_type`。

## T8 Case Study

任务目的：以“用户操作 -> 页面反馈 -> 数据结论”的方式展示系统如何发现 pattern。

示例路径：Overall 发现 Fog 延迟率较高；点击 Fog 进入 Weather Module；切换 Traffic 子视图；观察 Jam 条件下配送时长和延迟率继续升高；最后通过 Orders 或 Risk 子视图查看代表订单或高延迟组合。
