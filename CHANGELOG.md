# 变更日志

## 2026-01-04

### MTD 页面重构
- **重大变更**: 将 MTD 项目管理页面从卡片布局重构为表格布局
- **新增**: 抽屉式表单组件 (ProjectSheet, EquipmentSheet, FixtureSheet, TemplateManageSheet)
- **新增**: 模板管理抽屉，支持预览和下载编辑
- **修复**: Select 下拉框在 Dialog 中的 z-index 冲突问题

### API 更新
- **新增**: PUT /api/mtd/projects/{id} - 更新项目
- **新增**: PUT /api/mtd/equipment/{id} - 更新设备  
- **新增**: PUT /api/mtd/fixtures/{id} - 更新夹具
- **新增**: GET /api/ppt/templates/{id}/thumbnail - 获取缩略图
- **新增**: GET /api/ppt/templates/{id}/download - 下载模板

### 技术栈
- 前端: Next.js 16.1.1, TypeScript, shadcn/ui
- 后端: FastAPI, Python 3.8, SQLAlchemy
