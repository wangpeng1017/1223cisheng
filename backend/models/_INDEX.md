# backend/models 架构说明
SQLAlchemy数据模型定义
⚠️ 文件夹变化时请更新此文件

## 文件清单
| 文件名 | 地位 | 功能 |
|--------|------|------|
| fai.py | 核心 | FAIExtraction/FAIItem表模型，含category字段 |
| equipment.py | 核心 | Equipment设备模型，支持PPT模板绑定 |
| fixture.py | 核心 | Fixture夹具模型，支持PPT模板绑定 |
| ppt_template.py | 新增 | PPTTemplate/PPTPlaceholder模板模型 |
| __init__.py | 配置 | 模块初始化 |
