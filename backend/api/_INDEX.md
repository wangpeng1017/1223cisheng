# backend/api 架构说明
FastAPI路由层，提供PDF上传、FAI数据查询、MTD项目管理、PPT模板接口
⚠️ 文件夹变化时请更新此文件

## 文件清单
| 文件名 | 地位 | 功能 |
|--------|------|------|
| extract.py | 核心 | /api/extract 上传PDF并提取FAI |
| mtd.py | 核心 | /api/mtd MTD项目、设备、夹具管理 |
| ppt_template_api.py | 新增 | /api/ppt/templates PPT模板上传、解析、绑定 |
| __init__.py | 配置 | 模块初始化 |
