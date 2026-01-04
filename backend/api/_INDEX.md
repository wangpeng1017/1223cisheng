# API 接口目录

> 后端 FastAPI 路由定义

## 文件清单

| 文件 | 地位 | 功能 |
|------|------|------|
| mtd.py | 核心接口 | MTD 项目/设备/夹具 CRUD |
| ppt_template_api.py | 功能接口 | PPT 模板上传/下载/预览 |
| extract.py | 功能接口 | FAI 数据提取 |
| ppt_template.py | 辅助接口 | 模板辅助功能 |

## 最近变更 (2026-01-04)
- mtd.py: 添加 PUT 路由支持更新操作
- ppt_template_api.py: 添加缩略图生成和下载接口
