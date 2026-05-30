# 原始数据说明

本目录用于放置 Kaggle 原始外卖配送数据。由于课程项目仓库不提交原始数据文件，请用户自行下载。

下载地址：https://www.kaggle.com/datasets/gauravmalik26/food-delivery-dataset

使用方式：

1. 从 Kaggle 下载 Food Delivery Dataset。
2. 解压后找到 `train.csv`。
3. 将文件重命名为 `food_delivery.csv`。
4. 放置到本目录，最终路径应为：

```text
data/raw/food_delivery.csv
```

完成后可在项目根目录运行：

```bash
python scripts/preprocess.py
```
